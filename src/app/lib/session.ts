export const ACCESS_TOKEN_STORAGE_KEY = "taplink_access_token";
export const SESSION_USER_STORAGE_KEY = "taplink_session_user";

export type SessionRole = "USER" | "ADMIN";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: SessionRole;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function setAccessToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
}

export function clearAccessToken(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  clearSessionUser();
}

export function getSessionUser(): SessionUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(SESSION_USER_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<SessionUser>;
    if (!parsed.id || !parsed.email || !parsed.name || (parsed.role !== "USER" && parsed.role !== "ADMIN")) {
      return null;
    }
    return {
      id: parsed.id,
      name: parsed.name,
      email: parsed.email,
      role: parsed.role,
    };
  } catch {
    return null;
  }
}

export function setSessionUser(user: SessionUser): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SESSION_USER_STORAGE_KEY, JSON.stringify(user));
}

export function clearSessionUser(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SESSION_USER_STORAGE_KEY);
}

export function clearSession(): void {
  clearAccessToken();
  clearSessionUser();
}

export function dashboardPathForRole(role: SessionRole): string {
  return role === "ADMIN" ? "/dashboard" : "/my-tags";
}
