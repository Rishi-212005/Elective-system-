import { Elective } from "../models/Elective";

const seedElectives = [
  { legacyId: "1", code: "CV401", name: "Disaster Management", facultyName: "Dr. R. Kumar", department: "CIVIL", seatLimit: 70 },
  { legacyId: "2", code: "CV402", name: "Sustainability In Engineering Practices", facultyName: "Dr. S. Devi", department: "CIVIL", seatLimit: 70 },
  { legacyId: "3", code: "EE401", name: "Renewable Energy Sources", facultyName: "Dr. A. Prasad", department: "EEE", seatLimit: 70 },
  { legacyId: "4", code: "ME401", name: "Automation and Robotics", facultyName: "Dr. N. Rao", department: "ME", seatLimit: 70 },
  { legacyId: "5", code: "EC401", name: "IoT Fundamentals & Applications", facultyName: "Dr. P. Reddy", department: "ECE", seatLimit: 70 },
  { legacyId: "6", code: "CS402", name: "Operating Systems", facultyName: "Dr. K. Sharma", department: "CSE", seatLimit: 70 },
  { legacyId: "7", code: "CS403", name: "Introduction to Machine Learning", facultyName: "Dr. P. Iyer", department: "CSE", seatLimit: 70 },
  { legacyId: "8", code: "CH401", name: "Basics of Nanotechnology", facultyName: "Dr. M. Nair", department: "CHEM", seatLimit: 70 },
  { legacyId: "9", code: "MA401", name: "Optimization Techniques", facultyName: "Dr. V. Das", department: "MATH", seatLimit: 70 },
  { legacyId: "10", code: "MA402", name: "Mathematical Foundation of Quantum Technologies", facultyName: "Dr. S. Banerjee", department: "MATH", seatLimit: 70 },
  { legacyId: "11", code: "PH401", name: "Physics of Electronic Materials and Devices", facultyName: "Dr. T. Singh", department: "PHY", seatLimit: 70 },
  { legacyId: "12", code: "CH402", name: "Chemistry of Polymers and Applications", facultyName: "Dr. K. Gupta", department: "CHEM", seatLimit: 70 },
  { legacyId: "13", code: "HS401", name: "Academic Writing and Public Speaking", facultyName: "Prof. L. Joseph", department: "HSS", seatLimit: 70 },
];

export async function ensureElectivesSeeded() {
  const existing = await Elective.find({}).select("legacyId code name department seatLimit isActive").lean();

  const existingKey = new Set(
    existing.map((e: any) => `${String(e.legacyId)}::${String(e.code)}::${String(e.name)}::${String(e.department)}`)
  );
  const seedKey = new Set(
    seedElectives.map((e) => `${String(e.legacyId)}::${String(e.code)}::${String(e.name)}::${String(e.department)}`)
  );

  const looksSame =
    existing.length === seedElectives.length &&
    Array.from(seedKey).every((k) => existingKey.has(k));

  if (looksSame) return;

  // Hackathon-friendly reset: keep DB electives exactly matching the configured list.
  await Elective.deleteMany({});
  await Elective.insertMany(seedElectives.map((e) => ({ ...e, isActive: true })));
}

