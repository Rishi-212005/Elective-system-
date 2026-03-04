import { apiFetch } from "./http";
import type { AdminStudentRow } from "./admin";

export type FacultyStats = {
  department: string;
  totalStudents: number;
  allocated: number;
  unallocated: number;
};

export function getFacultyStats() {
  return apiFetch<FacultyStats>("/faculty/stats", { auth: true });
}

export function getFacultyStudents() {
  // Reuse AdminStudentRow shape for convenience
  return apiFetch<AdminStudentRow[]>("/faculty/students", { auth: true });
}

