import { apiFetch } from "./http";
import type { AdminStudentRow, CgpaFlagRow } from "./admin";

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

export function getFacultyCgpaFlags() {
  return apiFetch<
    Pick<
      CgpaFlagRow,
      | "id"
      | "rollNumber"
      | "name"
      | "semester"
      | "semesterSlot"
      | "cgpaEntered"
      | "cgpaOfficial"
      | "createdAt"
      | "sourceBatch"
    >[]
  >("/faculty/cgpa-flags", { auth: true });
}

export function resolveFacultyCgpaFlag(id: string, notes?: string) {
  return apiFetch<{ id: string; status: string }>(`/faculty/cgpa-flags/${id}/resolve`, {
    method: "POST",
    auth: true,
    body: JSON.stringify({ notes }),
  });
}

