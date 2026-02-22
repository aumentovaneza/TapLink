import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";

import { ApiError, apiRequest } from "../../lib/api";
import {
  clearSession,
  dashboardPathForRole,
  getAccessToken,
  getSessionUser,
  SessionUser,
  setSessionUser,
} from "../../lib/session";

interface MeResponse {
  user: SessionUser;
}

async function resolveSessionUser(): Promise<SessionUser | null> {
  const token = getAccessToken();
  if (!token) {
    clearSession();
    return null;
  }

  const cached = getSessionUser();
  try {
    const response = await apiRequest<MeResponse>("/auth/me", { auth: true });
    setSessionUser(response.user);
    return response.user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      clearSession();
      return null;
    }
    return cached;
  }
}

function AuthLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center pt-16">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
    </div>
  );
}

export function RequireAuth() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    let active = true;

    void resolveSessionUser().then((resolved) => {
      if (!active) {
        return;
      }
      setUser(resolved);
      setReady(true);
    });

    return () => {
      active = false;
    };
  }, []);

  if (!ready) {
    return <AuthLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export function RequireAdmin() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    let active = true;

    void resolveSessionUser().then((resolved) => {
      if (!active) {
        return;
      }
      setUser(resolved);
      setReady(true);
    });

    return () => {
      active = false;
    };
  }, []);

  if (!ready) {
    return <AuthLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "ADMIN") {
    return <Navigate to={dashboardPathForRole(user.role)} replace />;
  }

  return <Outlet />;
}

export function RedirectAuthenticatedFromLogin() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    let active = true;

    void resolveSessionUser().then((resolved) => {
      if (!active) {
        return;
      }
      setUser(resolved);
      setReady(true);
    });

    return () => {
      active = false;
    };
  }, []);

  if (!ready) {
    return <AuthLoader />;
  }

  if (user) {
    return <Navigate to={dashboardPathForRole(user.role)} replace />;
  }

  return <Outlet />;
}
