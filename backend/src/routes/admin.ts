import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole, type AuthedRequest } from "../middleware/auth";
import { Elective } from "../models/Elective";
import { Preference } from "../models/Preference";
import { Allocation } from "../models/Allocation";
import { OfficialCgpaSnapshot } from "../models/OfficialCgpaSnapshot";
import { CgpaFlag } from "../models/CgpaFlag";
import { StudentProfile } from "../models/StudentProfile";

const router = Router();

router.use(requireAuth, requireRole("admin"));

// --- Dashboard stats ---
router.get("/stats", async (_req, res) => {
  const [totalElectives, totalPrefs, totalAllocations] = await Promise.all([
    Elective.countDocuments({ isActive: true }),
    Preference.countDocuments({ status: "submitted" }),
    Allocation.countDocuments({ status: "allocated" }),
  ]);

  const allocated = totalAllocations;
  const unallocated = Math.max(totalPrefs - allocated, 0);

  return res.json({
    totalStudents: totalPrefs,
    totalElectives,
    allocated,
    unallocated,
  });
});

// --- Data summary: verify recently added students & allocation are stored in MongoDB ---
router.get("/data-summary", async (_req, res) => {
  const [
    submittedCount,
    allocationCount,
    officialCgpaCount,
    flaggedOpenCount,
  ] = await Promise.all([
    Preference.countDocuments({ status: "submitted" }),
    Allocation.countDocuments({ status: "allocated" }),
    OfficialCgpaSnapshot.countDocuments(),
    CgpaFlag.countDocuments({ status: "open" }),
  ]);

  return res.json({
    submittedStudents: submittedCount,
    allocatedInDb: allocationCount,
    officialCgpaRecords: officialCgpaCount,
    flaggedExcluded: flaggedOpenCount,
    unallocatedApprox: Math.max(submittedCount - allocationCount, 0),
  });
});

// --- Electives CRUD + metrics for dashboard ---
router.get("/electives", async (_req, res) => {
  const [electives, prefs, allocations] = await Promise.all([
    Elective.find({}).sort({ code: 1 }).lean(),
    Preference.find({ status: "submitted" }).select("preferences").lean(),
    Allocation.find({ status: "allocated" }).select("electiveLegacyId").lean(),
  ]);

  const requestCounts = new Map<string, number>();
  for (const p of prefs) {
    for (const pr of p.preferences) {
      const key = pr.electiveLegacyId as string;
      requestCounts.set(key, (requestCounts.get(key) ?? 0) + 1);
    }
  }

  const allocatedCounts = new Map<string, number>();
  for (const a of allocations) {
    if (!a.electiveLegacyId) continue;
    const key = a.electiveLegacyId as string;
    allocatedCounts.set(key, (allocatedCounts.get(key) ?? 0) + 1);
  }

  const list = electives.map((e) => ({
    ...e,
    requestedCount: requestCounts.get(e.legacyId) ?? 0,
    allocatedCount: allocatedCounts.get(e.legacyId) ?? 0,
  }));

  return res.json(list);
});

const electiveSchema = z.object({
  legacyId: z.string().min(1),
  code: z.string().min(1),
  name: z.string().min(1),
  facultyName: z.string().optional(),
  department: z.string().optional(),
  seatLimit: z.number().int().min(1),
  semester: z.string().min(1),
  // Optional preference deadline; sent as ISO string or omitted
  preferenceDeadline: z.string().datetime().optional().or(z.literal("").transform(() => undefined)),
  isActive: z.boolean().optional().default(true),
});

router.post("/electives", async (req: AuthedRequest, res) => {
  const data = electiveSchema.parse(req.body);
  const created = await Elective.create(data);
  return res.status(201).json(created);
});

router.put("/electives/:id", async (req: AuthedRequest, res) => {
  const data = electiveSchema.partial().parse(req.body);
  const updated = await Elective.findOneAndUpdate({ legacyId: req.params.id }, data, { new: true });
  if (!updated) return res.status(404).json({ message: "Elective not found" });
  return res.json(updated);
});

router.delete("/electives/:id", async (req: AuthedRequest, res) => {
  const deleted = await Elective.findOneAndDelete({ legacyId: req.params.id });
  if (!deleted) return res.status(404).json({ message: "Elective not found" });
  return res.status(204).send();
});

// --- Students table (submitted only) ---
router.get("/students", async (_req, res) => {
  const prefs = await Preference.find({ status: "submitted" }).lean();

  const allocations = await Allocation.find({
    studentUserId: { $in: prefs.map((p) => p.studentUserId) },
  })
    .select("studentUserId electiveLegacyId status roundAllocated announced announcedAt")
    .lean();

  const allocByStudent = new Map(
    allocations.map((a) => [a.studentUserId.toString(), a])
  );

  const electives = await Elective.find({}).select("legacyId name code").lean();
  const electiveByLegacy = new Map(electives.map((e) => [e.legacyId, e]));

  const rows = prefs.map((p) => {
    const alloc = allocByStudent.get(p.studentUserId.toString());
    const allocatedElective =
      alloc && alloc.electiveLegacyId
        ? electiveByLegacy.get(alloc.electiveLegacyId as string)
        : null;

    return {
      id: p._id,
      rollNumber: p.studentUsername,
      name: p.studentName,
      department: p.department,
      semester: p.semester,
      cgpa: p.cgpa,
      backlogs: p.backlogs ?? 0,
      preferences: p.preferences
        .slice()
        .sort((a, b) => a.rank - b.rank)
        .map((pr) => electiveByLegacy.get(pr.electiveLegacyId)?.code || pr.electiveLegacyId),
      allocatedElective: allocatedElective?.name || null,
      allocatedElectiveCode: allocatedElective?.code || null,
      roundAllocated: alloc?.roundAllocated ?? null,
      allocationStatus: alloc?.status ?? "pending",
      announced: (alloc as any)?.announced ?? false,
      announcedAt: (alloc as any)?.announcedAt ?? null,
      submittedAt: p.submittedAt ?? null,
    };
  });

  return res.json(rows);
});

// --- Official CGPA snapshots upload ---
const cgpaSnapshotRowSchema = z.object({
  rollNumber: z.string().min(1),
  name: z.string().min(1),
  cgpaOfficial: z.number().min(0).max(10),
});

const cgpaSnapshotUploadSchema = z.object({
  semesterSlot: z.string().min(1),
  department: z.string().min(1),
  batchLabel: z.string().min(1),
  rows: z.array(cgpaSnapshotRowSchema).min(1),
});

router.post("/cgpa-snapshots/upload", async (req: AuthedRequest, res) => {
  const data = cgpaSnapshotUploadSchema.parse(req.body);

  const username = req.user?.username ?? "admin";

  const bulkOps = data.rows.map((row) => ({
    updateOne: {
      filter: { rollNumber: row.rollNumber, semesterSlot: data.semesterSlot },
      update: {
        $set: {
          name: row.name,
          department: data.department,
          semesterSlot: data.semesterSlot,
          cgpaOfficial: row.cgpaOfficial,
          batchLabel: data.batchLabel,
          uploadedBy: username,
          uploadedAt: new Date(),
        },
      },
      upsert: true,
    },
  }));

  if (bulkOps.length > 0) {
    await OfficialCgpaSnapshot.bulkWrite(bulkOps);
  }

  return res.json({ count: bulkOps.length });
});

// Summary of uploaded official CGPA data (to confirm CSV is stored in MongoDB)
router.get("/cgpa-snapshots/summary", async (_req: AuthedRequest, res) => {
  const docs = await OfficialCgpaSnapshot.aggregate([
    { $group: { _id: { department: "$department", semesterSlot: "$semesterSlot" }, count: { $sum: 1 } } },
    { $sort: { "_id.department": 1, "_id.semesterSlot": 1 } },
  ]);
  const summary = docs.map((d: any) => ({
    department: d._id.department,
    semesterSlot: d._id.semesterSlot,
    count: d.count,
  }));
  return res.json({ summary });
});

// --- CGPA verification run ---
const cgpaVerifySchema = z.object({
  semesterSlot: z.string().min(1),
  department: z.string().min(1),
});

router.post("/cgpa-verify/run", async (req: AuthedRequest, res) => {
  const { semesterSlot, department } = cgpaVerifySchema.parse(req.body);

  const slotToSemesters: Record<string, number[]> = {
    "3-1": [5],
    "3-2": [6],
    "4-1": [7],
    "4-2": [8],
  };

  const targetSemesters = slotToSemesters[semesterSlot] ?? [];

  const prefFilter: any = { status: "submitted", department };
  if (targetSemesters.length > 0) {
    prefFilter.semester = { $in: targetSemesters };
  }

  const [prefs, snapshots] = await Promise.all([
    Preference.find(prefFilter).lean(),
    OfficialCgpaSnapshot.find({ department, semesterSlot }).lean(),
  ]);

  const snapshotByRoll = new Map(
    snapshots.map((s) => [String(s.rollNumber).toLowerCase(), s])
  );

  let totalChecked = 0;
  let matched = 0;
  let flagged = 0;
  let missingOfficial = 0;

  const bulkProfiles: Parameters<typeof StudentProfile.bulkWrite>[0] = [];

  for (const p of prefs) {
    const roll = String(p.studentUsername).toLowerCase();
    const snap = snapshotByRoll.get(roll);
    if (!snap) {
      missingOfficial += 1;
      totalChecked += 1;

      const entered = p.cgpa as number;
      const studentUserId = p.studentUserId;
      const commonMissing = {
        studentUserId,
        rollNumber: p.studentUsername,
        name: p.studentName,
        department: p.department,
        semester: p.semester,
        semesterSlot,
        cgpaEntered: entered,
        // store entered value as official placeholder; flag reason is notes/batch
        cgpaOfficial: entered,
        sourceBatch: "NO_OFFICIAL_CGPA",
      };

      flagged += 1;

      await CgpaFlag.updateOne(
        { rollNumber: p.studentUsername, semesterSlot, status: "open" },
        { $set: commonMissing },
        { upsert: true }
      );

      bulkProfiles.push({
        updateOne: {
          filter: { userId: studentUserId },
          update: { $set: { cgpaVerified: false } },
        },
      });

      continue;
    }

    totalChecked += 1;
    const entered = p.cgpa as number;
    const official = (snap as any).cgpaOfficial as number;

    const diff = Math.abs(entered - official);
    const studentUserId = p.studentUserId;
    const common = {
      studentUserId,
      rollNumber: p.studentUsername,
      name: p.studentName,
      department: p.department,
      semester: p.semester,
      semesterSlot,
      cgpaEntered: entered,
      cgpaOfficial: official,
      sourceBatch: (snap as any).batchLabel as string,
    };

    if (diff > 0.01) {
      flagged += 1;
      await CgpaFlag.updateOne(
        { rollNumber: p.studentUsername, semesterSlot, status: "open" },
        { $set: common },
        { upsert: true }
      );

      bulkProfiles.push({
        updateOne: {
          filter: { userId: studentUserId },
          update: { $set: { cgpaVerified: false } },
        },
      });
    } else {
      matched += 1;
      await CgpaFlag.updateMany(
        { rollNumber: p.studentUsername, semesterSlot, status: "open" },
        {
          $set: {
            status: "resolved",
            notes: "Auto-resolved by CGPA verification",
          },
        }
      );

      bulkProfiles.push({
        updateOne: {
          filter: { userId: studentUserId },
          update: { $set: { cgpaVerified: true, cgpaVerifiedAt: new Date() } },
        },
      });
    }
  }

  if (bulkProfiles.length > 0) {
    await StudentProfile.bulkWrite(bulkProfiles);
  }

  const openFlags = await CgpaFlag.find({
    department,
    semesterSlot,
    status: "open",
  })
    .sort({ createdAt: -1 })
    .lean();

  return res.json({
    totalChecked,
    matched,
    flagged,
    missingOfficial,
    flags: openFlags.map((f) => ({
      id: f._id,
      rollNumber: f.rollNumber,
      name: f.name,
      department: f.department,
      semester: f.semester,
      semesterSlot: f.semesterSlot,
      cgpaEntered: f.cgpaEntered,
      cgpaOfficial: f.cgpaOfficial,
      sourceBatch: f.sourceBatch,
      status: f.status,
      createdAt: f.createdAt,
    })),
  });
});

// --- CGPA flags listing & resolve (admin) ---
router.get("/cgpa-flags", async (req: AuthedRequest, res) => {
  const { department, semesterSlot, status } = req.query as {
    department?: string;
    semesterSlot?: string;
    status?: string;
  };

  const filter: any = {};
  if (department) filter.department = department;
  if (semesterSlot) filter.semesterSlot = semesterSlot;
  if (status) filter.status = status;

  const flags = await CgpaFlag.find(filter).sort({ createdAt: -1 }).lean();
  return res.json(
    flags.map((f) => ({
      id: f._id,
      rollNumber: f.rollNumber,
      name: f.name,
      department: f.department,
      semester: f.semester,
      semesterSlot: f.semesterSlot,
      cgpaEntered: f.cgpaEntered,
      cgpaOfficial: f.cgpaOfficial,
      sourceBatch: f.sourceBatch,
      status: f.status,
      createdAt: f.createdAt,
    }))
  );
});

router.post("/cgpa-flags/:id/resolve", async (req: AuthedRequest, res) => {
  const { notes } = (req.body ?? {}) as { notes?: string };
  const updated = await CgpaFlag.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        status: "resolved",
        notes: notes ?? "Resolved by admin",
      },
    },
    { new: true }
  );

  if (!updated) return res.status(404).json({ message: "Flag not found" });
  return res.json({ id: updated._id, status: updated.status });
});

// Forward flagged student to mentor – keep flag open, but cancel their preferences for this cycle
router.post("/cgpa-flags/:id/forward", async (req: AuthedRequest, res) => {
  const flag = await CgpaFlag.findById(req.params.id).lean();
  if (!flag) return res.status(404).json({ message: "Flag not found" });

  // Move their submitted preferences back to draft so they are clearly out of this allocation round.
  await Preference.updateMany(
    { studentUsername: flag.rollNumber, department: flag.department },
    {
      $set: { status: "draft" },
      $unset: { submittedAt: "" },
    }
  );

  await StudentProfile.updateOne(
    { userId: flag.studentUserId },
    { $set: { cgpaVerified: false } }
  );

  await CgpaFlag.updateOne(
    { _id: flag._id },
    {
      $set: {
        notes: "Forwarded to mentor by admin",
      },
    }
  );

  return res.json({ ok: true });
});

export default router;

