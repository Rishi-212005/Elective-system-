import { Schema, model } from "mongoose";

const officialCgpaSnapshotSchema = new Schema(
  {
    rollNumber: { type: String, required: true },
    name: { type: String, required: true },
    department: { type: String, required: true },
    semesterSlot: { type: String, required: true }, // e.g. "3-1"
    cgpaOfficial: { type: Number, required: true, min: 0, max: 10 },
    batchLabel: { type: String, required: true }, // e.g. "CSE · 3-1 · 2025-26"
    uploadedBy: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

officialCgpaSnapshotSchema.index(
  { rollNumber: 1, semesterSlot: 1 },
  { unique: true, name: "ix_official_cgpa_roll_sem" }
);

export const OfficialCgpaSnapshot = model("OfficialCgpaSnapshot", officialCgpaSnapshotSchema);

