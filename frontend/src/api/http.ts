import type { UserRole } from "@/context/AuthContext";

export type ApiError = {
  message: string;
  status?: number;
};

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL?.toString() || "http://localhost:4000";

const TOKEN_KEY = "eh_token";
const USER_KEY = "eh_user";

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredAuth(token: string, user: { id: string; name: string; role: UserRole }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): { id: string; name: string; role: UserRole } | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function parseError(res: Response): Promise<ApiError> {
  const status = res.status;
  try {
    const data = await res.json();
    if (typeof data?.message === "string") return { message: data.message, status };
  } catch {
    // ignore
  }
  return { message: `Request failed (${status})`, status };
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;

  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  if (init.auth) {
    const token = getStoredToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(url, { ...init, headers });
  } catch (e: any) {
    // Network error (backend down, CORS, wrong URL, etc.)
    const msg =
      e?.message === "Failed to fetch"
        ? "Cannot reach server. Make sure the backend is running at " + API_BASE_URL
        : e?.message || "Network error";
    throw { message: msg };
  }
  if (!res.ok) throw await parseError(res);

  // Handle empty responses
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

