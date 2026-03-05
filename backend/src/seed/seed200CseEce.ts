/**
 * Seed 200 students (100 CSE + 100 ECE) for 6th sem (3-2).
 * Roll numbers and official CGPAs match the uploaded CSV data.
 * - 20 students have WRONG entered CGPA → will be flagged on verification (CSE220001-010, ECE220001-010).
 * - 180 students have correct CGPA → verified, eligible for allocation.
 * - 80+ students pick CS402 (Cyber Security) as first choice → elective exceeds 70 requests.
 *
 * Run: npx ts-node -r dotenv/config src/seed/seed200CseEce.ts
 * Or:  npm run seed:200  (if added to package.json)
 */
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { StudentProfile } from "../models/StudentProfile";
import { Preference } from "../models/Preference";
import { Elective } from "../models/Elective";

// Official CGPAs from your CSE 3-2 CSV (CSE220001 .. CSE220100)
const CSE_OFFICIAL_CGPAS = [
  9.2, 8.7, 7.9, 8.3, 9.6, 7.4, 8.1, 6.8, 7.2, 8.9, 6.5, 7.8, 8.4, 9.1, 7.6, 8.0, 9.4, 6.9, 7.3, 8.6,
  9.0, 7.1, 8.2, 6.7, 7.9, 8.5, 9.3, 7.0, 8.8, 6.6, 7.7, 8.3, 9.2, 7.5, 8.1, 6.8, 7.4, 8.9, 9.5, 7.2,
  8.0, 6.9, 7.6, 8.4, 9.1, 7.3, 8.7, 6.5, 7.8, 8.6, 9.0, 7.1, 8.2, 6.7, 7.9, 8.5, 9.4, 7.0, 8.8, 6.6,
  7.7, 8.3, 9.2, 7.4, 8.1, 6.9, 7.5, 8.9, 9.6, 7.2, 8.0, 6.8, 7.6, 8.4, 9.1, 7.3, 8.7, 6.5, 7.8, 8.6,
  9.3, 7.1, 8.2, 6.7, 7.9, 8.5, 9.4, 7.0, 8.8, 6.6, 7.7, 8.3, 9.0, 7.4, 8.1, 6.9, 7.5, 8.9, 9.5, 7.2,
];

// Official CGPAs from your ECE 3-2 CSV (ECE220001 .. ECE220100)
const ECE_OFFICIAL_CGPAS = [
  8.9, 7.8, 8.1, 7.2, 8.6, 6.9, 7.5, 8.3, 9.1, 7.0, 8.0, 7.4, 8.7, 6.8, 7.9, 8.4, 9.0, 7.3, 8.2, 6.7,
  7.6, 8.5, 9.2, 7.1, 8.8, 6.6, 7.7, 8.3, 9.1, 7.2, 8.0, 6.9, 7.5, 8.6, 9.3, 7.0, 8.1, 6.8, 7.9, 8.4,
  9.0, 7.3, 8.2, 6.7, 7.6, 8.5, 9.2, 7.1, 8.8, 6.6, 7.7, 8.3, 9.1, 7.2, 8.0, 6.9, 7.5, 8.6, 9.3, 7.0,
  8.1, 6.8, 7.9, 8.4, 9.0, 7.3, 8.2, 6.7, 7.6, 8.5, 9.2, 7.1, 8.8, 6.6, 7.7, 8.3, 9.1, 7.2, 8.0, 6.9,
  7.5, 8.6, 9.3, 7.0, 8.1, 6.8, 7.9, 8.4, 9.0, 7.3, 8.2, 6.7, 7.6, 8.5, 9.2, 7.1, 8.8, 6.6, 7.7, 8.3,
];

const SEMESTER = 6; // 3-2 = 6th sem
const PASSWORD = "student123";

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI is not set in .env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB, seeding 200 CSE+ECE students...");

  const electives = await Elective.find({ isActive: true }).lean();
  if (electives.length < 3) {
    console.error("Need at least 3 electives. Run electives seed first.");
    process.exit(1);
  }

  const cs402 = electives.find((e: { code: string }) => e.code === "CS402");
  const cs403 = electives.find((e: { code: string }) => e.code === "CS403");
  const others = electives.filter(
    (e: { code: string }) => e.code !== "CS402" && e.code !== "CS403"
  );
  if (!cs402 || !cs403 || others.length === 0) {
    console.error("Expected electives CS402, CS403 and others.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  type Row = { roll: string; name: string; department: string; officialCgpa: number; index: number };
  const cseRows: Row[] = Array.from({ length: 100 }, (_, i) => ({
    roll: `CSE220${String(i + 1).padStart(3, "0")}`,
    name: `CSE Student ${i + 1}`,
    department: "Computer Science",
    officialCgpa: CSE_OFFICIAL_CGPAS[i] ?? 7.5,
    index: i,
  }));
  const eceRows: Row[] = Array.from({ length: 100 }, (_, i) => ({
    roll: `ECE220${String(i + 1).padStart(3, "0")}`,
    name: `ECE Student ${i + 1}`,
    department: "Electronics",
    officialCgpa: ECE_OFFICIAL_CGPAS[i] ?? 7.5,
    index: i,
  }));

  const allRows = [...cseRows, ...eceRows];
  let created = 0;

  for (let idx = 0; idx < allRows.length; idx++) {
    const { roll, name, department, officialCgpa } = allRows[idx];
    const isCse = department === "Computer Science";
    const localIndex = isCse ? idx : idx - 100;

    // 20 flagged: wrong CGPA in preference (CSE 0-9, ECE 0-9)
    const isFlagged = (isCse && localIndex < 10) || (!isCse && localIndex < 10);
    const enteredCgpa = isFlagged ? Math.min(10, officialCgpa + 0.5) : officialCgpa;
    const backlogs = idx % 11 === 0 ? 2 : idx % 7 === 0 ? 1 : 0;

    let user = await User.findOne({ username: roll });
    if (!user) {
      user = await User.create({
        role: "student",
        name,
        username: roll,
        passwordHash,
        isActive: true,
      });
      created++;
    }

    await StudentProfile.findOneAndUpdate(
      { userId: user._id },
      {
        $set: {
          studentId: roll,
          profileCompleted: true,
          department,
          semester: SEMESTER,
          cgpa: officialCgpa,
          backlogs,
          degree: "B.Tech",
          year: "3rd Year",
        },
      },
      { upsert: true, new: true }
    );

    // First choice: 80 CSE + 40 ECE pick CS402 → 120 > 70 seat limit (edge case)
    let firstChoiceLegacyId: string;
    if (idx < 80) {
      firstChoiceLegacyId = (cs402 as { legacyId: string }).legacyId;
    } else if (idx < 120) {
      firstChoiceLegacyId = (cs403 as { legacyId: string }).legacyId;
    } else {
      const o = others[idx % others.length] as { legacyId: string };
      firstChoiceLegacyId = o.legacyId;
    }

    const chosen = new Set<string>([firstChoiceLegacyId]);
    const prefs: { electiveLegacyId: string; rank: number }[] = [
      { electiveLegacyId: firstChoiceLegacyId, rank: 1 },
    ];

    const pickOther = (): string => {
      const list = [cs402, cs403, ...others] as { legacyId: string }[];
      for (let k = 0; k < 20; k++) {
        const e = list[Math.floor(Math.random() * list.length)];
        if (!chosen.has(e.legacyId)) {
          chosen.add(e.legacyId);
          return e.legacyId;
        }
      }
      return (others[0] as { legacyId: string }).legacyId;
    };

    while (prefs.length < 3) {
      prefs.push({ electiveLegacyId: pickOther(), rank: prefs.length + 1 });
    }

    await Preference.findOneAndUpdate(
      { studentUserId: user._id },
      {
        $set: {
          studentUsername: roll,
          studentName: name,
          department,
          semester: SEMESTER,
          cgpa: enteredCgpa,
          backlogs,
          status: "submitted",
          submittedAt: new Date(),
          preferences: prefs,
        },
      },
      { upsert: true, new: true }
    );
  }

  console.log(`Seeded 200 students (CSE + ECE, 6th sem). Created ${created} new users.`);
  console.log(`Login: username = roll number (e.g. CSE220001), password = ${PASSWORD}`);
  console.log(`20 students have wrong CGPA (CSE220001-010, ECE220001-010) → will be flagged on verify.`);
  console.log(`120 students chose CS402 as first preference → elective exceeds 70 capacity.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
