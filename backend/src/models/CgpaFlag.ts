import { Schema, model, Types } from "mongoose";

const cgpaFlagSchema = new Schema(
  {
    studentUserId: { type: Types.ObjectId, ref: "User", required: true },
    rollNumber: { type: String, required: true },
    name: { type: String, required: true },
    department: { type: String, required: true },
    semester: { type: Number, required: true },
    semesterSlot: { type: String, required: true }, // e.g. "3-1"
    cgpaEntered: { type: Number, required: true, min: 0, max: 10 },
    cgpaOfficial: { type: Number, required: true, min: 0, max: 10 },
    sourceBatch: { type: String, required: true },
    status: {
      type: String,
      enum: ["open", "resolved"],
      default: "open",
      required: true,
    },
    notes: { type: String },
  },
  { timestamps: true }
);

cgpaFlagSchema.index({ rollNumber: 1, semesterSlot: 1, status: 1 });

export const CgpaFlag = model("CgpaFlag", cgpaFlagSchema);

