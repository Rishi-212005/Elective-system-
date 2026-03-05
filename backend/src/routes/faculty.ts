import { Router } from "express";
import { requireAuth, requireRole, type AuthedRequest } from "../middleware/auth";
import { Preference } from "../models/Preference";
import { Allocation } from "../models/Allocation";
import { Elective } from "../models/Elective";
import { CgpaFlag } from "../models/CgpaFlag";

const router = Router();

// Faculty (department mentor) views – read-only analytics scoped to a department.
router.use(requireAuth, requireRole("faculty"));

// For now, assume this mentor is the head of Computer Science department.
// This must match the `department` values stored in StudentProfile / Preference.
const FACULTY_DEPARTMENT = "Computer Science";

router.get("/stats", async (_req: AuthedRequest, res) => {
  // Students from this department who submitted preferences
  const prefs = await Preference.find({ status: "submitted", department: FACULTY_DEPARTMENT }).lean();
  const studentIds = prefs.map((p) => p.studentUserId);

  const allocations = await Allocation.find({
    studentUserId: { $in: studentIds },
  })
    .select("status")
    .lean();

  const totalStudents = prefs.length;
  const allocated = allocations.filter((a) => a.status === "allocated").length;
  const unallocated = Math.max(totalStudents - allocated, 0);

  return res.json({
    department: FACULTY_DEPARTMENT,
    totalStudents,
    allocated,
    unallocated,
  });
});

router.get("/students", async (_req: AuthedRequest, res) => {
  // Only submitted preferences from this department
  const prefs = await Preference.find({ status: "submitted", department: FACULTY_DEPARTMENT }).lean();

  const allocations = await Allocation.find({
    studentUserId: { $in: prefs.map((p) => p.studentUserId) },
  })
    .select("studentUserId electiveLegacyId status roundAllocated")
    .lean();

  const allocByStudent = new Map<string, (typeof allocations)[number]>(
    allocations.map((a) => [a.studentUserId.toString(), a])
  );

  const electives = await Elective.find({}).select("legacyId name code").lean();
  const electiveByLegacy = new Map(electives.map((e) => [e.legacyId, e]));

  const rows = prefs
    .map((p) => {
      const alloc = allocByStudent.get(p.studentUserId.toString());
      const allocatedElective =
        alloc && alloc.electiveLegacyId ? electiveByLegacy.get(alloc.electiveLegacyId as string) : null;

      if (!alloc || alloc.status !== "allocated") return null;

      return {
        id: p._id.toString(),
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
        roundAllocated: alloc.roundAllocated ?? null,
        allocationStatus: alloc.status,
        submittedAt: p.submittedAt ?? null,
      };
    })
    .filter(Boolean);

  return res.json(rows);
});

// CGPA flags for this department
router.get("/cgpa-flags", async (_req: AuthedRequest, res) => {
  const flags = await CgpaFlag.find({
    department: FACULTY_DEPARTMENT,
    status: "open",
  })
    .sort({ createdAt: -1 })
    .lean();

  return res.json(
    flags.map((f) => ({
      id: f._id,
      rollNumber: f.rollNumber,
      name: f.name,
      semester: f.semester,
      semesterSlot: f.semesterSlot,
      cgpaEntered: f.cgpaEntered,
      cgpaOfficial: f.cgpaOfficial,
      createdAt: f.createdAt,
      sourceBatch: f.sourceBatch,
    }))
  );
});

router.post("/cgpa-flags/:id/resolve", async (req: AuthedRequest, res) => {
  const { notes } = (req.body ?? {}) as { notes?: string };
  const updated = await CgpaFlag.findOneAndUpdate(
    { _id: req.params.id, department: FACULTY_DEPARTMENT },
    {
      $set: {
        status: "resolved",
        notes: notes ?? "Resolved by faculty",
      },
    },
    { new: true }
  );

  if (!updated) return res.status(404).json({ message: "Flag not found" });
  return res.json({ id: updated._id, status: updated.status });
});

export default router;

