import { apiFetch } from "./http";

export type AdminStats = {
  totalStudents: number;
  totalElectives: number;
  allocated: number;
  unallocated: number;
};

export type AdminElective = {
  _id: string;
  legacyId: string;
  code: string;
  name: string;
  facultyName?: string;
  department?: string;
  seatLimit: number;
  isActive: boolean;
  semester?: string;
  requestedCount?: number;
  allocatedCount?: number;
};

export type AdminStudentRow = {
  id: string;
  rollNumber: string;
  name: string;
  department: string;
  semester: number;
  cgpa: number;
  backlogs: number;
  preferences: string[];
  allocatedElective: string | null;
  allocatedElectiveCode: string | null;
  roundAllocated: number | null;
  allocationStatus: "allocated" | "unallocated" | "pending";
};

export type RunAllocationResponse = {
  allocatedStudents: { studentId: string; electiveId: string }[];
  unallocatedStudents: { studentId: string }[];
  seatUtilization: { elective: string; filled: number; capacity: number }[];
  rounds: { label: string; allocated: number; unallocated: number }[];
};

export function getAdminStats() {
  return apiFetch<AdminStats>("/admin/stats", { auth: true });
}

export function getAdminElectives() {
  return apiFetch<AdminElective[]>("/admin/electives", { auth: true });
}

export function createAdminElective(input: Omit<AdminElective, "_id" | "isActive"> & { isActive?: boolean }) {
  return apiFetch<AdminElective>("/admin/electives", {
    method: "POST",
    auth: true,
    body: JSON.stringify(input),
  });
}

export function updateAdminElective(id: string, input: Partial<AdminElective>) {
  return apiFetch<AdminElective>(`/admin/electives/${id}`, {
    method: "PUT",
    auth: true,
    body: JSON.stringify(input),
  });
}

export function deleteAdminElective(id: string) {
  return apiFetch<null>(`/admin/electives/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

export function getAdminStudents() {
  return apiFetch<AdminStudentRow[]>("/admin/students", { auth: true });
}

export function runAllocation() {
  return apiFetch<RunAllocationResponse>("/allocation/run-allocation", {
    method: "POST",
    auth: true,
  });
}

export function announceAllocationResults() {
  return apiFetch<{ updated: number }>("/allocation/announce", {
    method: "POST",
    auth: true,
  });
}

export function resetAllocationOnServer() {
  return apiFetch<{ deleted: number }>("/allocation/reset", {
    method: "POST",
    auth: true,
  });
}

