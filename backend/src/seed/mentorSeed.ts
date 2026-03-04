import bcrypt from "bcryptjs";
import { User } from "../models/User";

export async function ensureDefaultMentor() {
  const existing = await User.findOne({ role: "faculty", username: "mentor" }).select("_id");
  if (existing) return;

  const passwordHash = await bcrypt.hash("mentor123", 10);
  await User.create({
    role: "faculty",
    name: "Default Mentor",
    username: "mentor",
    email: "mentor@college.ac.in",
    passwordHash,
    isActive: true,
  });
}

