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
  preferenceDeadline?: string;
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
  announced?: boolean;
  announcedAt?: string | null;
  submittedAt?: string | null;
};

export type RunAllocationResponse = {
  allocatedStudents: { studentId: string; electiveId: string }[];
  unallocatedStudents: { studentId: string }[];
  seatUtilization: { elective: string; filled: number; capacity: number }[];
  rounds: { label: string; allocated: number; unallocated: number }[];
};

export type CgpaFlagRow = {
  id: string;
  rollNumber: string;
  name: string;
  department: string;
  semester: number;
  semesterSlot: string;
  cgpaEntered: number;
  cgpaOfficial: number;
  sourceBatch: string;
  status: "open" | "resolved";
  createdAt: string;
};

export type CgpaVerifyResponse = {
  totalChecked: number;
  matched: number;
  flagged: number;
  missingOfficial: number;
  flags: CgpaFlagRow[];
};

export function getAdminStats() {
  return apiFetch<AdminStats>("/admin/stats", { auth: true });
}

export type AdminDataSummary = {
  submittedStudents: number;
  allocatedInDb: number;
  officialCgpaRecords: number;
  flaggedExcluded: number;
  unallocatedApprox: number;
};

export function getAdminDataSummary() {
  return apiFetch<AdminDataSummary>("/admin/data-summary", { auth: true });
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

export function uploadOfficialCgpaSnapshots(input: {
  semesterSlot: string;
  department: string;
  batchLabel: string;
  rows: { rollNumber: string; name: string; cgpaOfficial: number }[];
}) {
  return apiFetch<{ count: number }>("/admin/cgpa-snapshots/upload", {
    method: "POST",
    auth: true,
    body: JSON.stringify(input),
  });
}

export function getCgpaSnapshotsSummary() {
  return apiFetch<{ summary: { department: string; semesterSlot: string; count: number }[] }>(
    "/admin/cgpa-snapshots/summary",
    { auth: true }
  );
}

export function runCgpaVerification(input: {
  semesterSlot: string;
  department: string;
}) {
  return apiFetch<CgpaVerifyResponse>("/admin/cgpa-verify/run", {
    method: "POST",
    auth: true,
    body: JSON.stringify(input),
  });
}

export function getCgpaFlags(params: {
  department?: string;
  semesterSlot?: string;
  status?: "open" | "resolved";
}) {
  const search = new URLSearchParams();
  if (params.department) search.set("department", params.department);
  if (params.semesterSlot) search.set("semesterSlot", params.semesterSlot);
  if (params.status) search.set("status", params.status);
  const query = search.toString();
  const url = `/admin/cgpa-flags${query ? `?${query}` : ""}`;
  return apiFetch<CgpaFlagRow[]>(url, { auth: true });
}

export function resolveCgpaFlag(id: string, notes?: string) {
  return apiFetch<{ id: string; status: string }>(`/admin/cgpa-flags/${id}/resolve`, {
    method: "POST",
    auth: true,
    body: JSON.stringify({ notes }),
  });
}

export function forwardCgpaFlag(id: string) {
  return apiFetch<{ ok: boolean }>(`/admin/cgpa-flags/${id}/forward`, {
    method: "POST",
    auth: true,
  });
}

