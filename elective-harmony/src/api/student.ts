import { apiFetch } from "./http";

export type StudentProfileResponse = {
  id: string;
  name: string;
  username: string; // roll number
  role: "student";
  profile: {
    studentId: string;
    profileCompleted: boolean;
    department: string;
    semester: number;
    cgpa: number;
    backlogs: number;
    degree?: string;
    year?: string;
    cgpaVerified: boolean;
    cgpaVerifiedAt?: string | null;
  };
};

export type StudentPreferencesResponse = {
  status: "none" | "draft" | "submitted";
  submittedAt?: string | null;
  updatedAt?: string | null;
  preferences: Array<{ electiveLegacyId: string; rank: number }>;
};

export type StudentAllocationResponse =
  | { announced: false }
  | {
      announced: true;
      announcedAt: string | null;
      status: "allocated" | "unallocated";
      elective: null | { legacyId: string; code: string; name: string; facultyName?: string; department?: string };
      roundAllocated: number | null;
      runId: string | null;
    };

export function getStudentProfile() {
  return apiFetch<StudentProfileResponse>("/student/me/profile", { auth: true });
}

export function updateStudentProfile(input: {
  name: string;
  email?: string;
  department: string;
  semester: number;
  cgpa: number;
  backlogs?: number;
  degree?: string;
  year?: string;
}) {
  return apiFetch<StudentProfileResponse>("/student/me/profile", {
    method: "PUT",
    auth: true,
    body: JSON.stringify(input),
  });
}

export function getStudentPreferences() {
  return apiFetch<StudentPreferencesResponse>("/student/me/preferences", { auth: true });
}

export function saveStudentPreferences(preferences: Array<{ electiveId: string; rank: number }>) {
  return apiFetch<StudentPreferencesResponse>("/student/me/preferences", {
    method: "PUT",
    auth: true,
    body: JSON.stringify({ preferences }),
  });
}

export function submitStudentPreferences() {
  return apiFetch<{ status: "submitted"; submittedAt: string }>("/student/me/preferences/submit", {
    method: "POST",
    auth: true,
  });
}

export function getStudentAllocation() {
  return apiFetch<StudentAllocationResponse>("/student/me/allocation", { auth: true });
}

