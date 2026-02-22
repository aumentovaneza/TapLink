import { getAccessToken } from "./session";

const DEFAULT_API_BASE_URL = "http://localhost:3000";

function normalizeApiBaseUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return DEFAULT_API_BASE_URL;
  }

  // Allow relative API URLs (e.g. "/api") for reverse-proxy setups.
  if (trimmed.startsWith("/")) {
    return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProtocol.endsWith("/") ? withProtocol.slice(0, -1) : withProtocol;
}

const rawBaseUrl = import.meta.env.VITE_API_URL || DEFAULT_API_BASE_URL;
export const API_BASE_URL = normalizeApiBaseUrl(rawBaseUrl);

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  auth?: boolean;
}

function buildHeaders(existing?: HeadersInit): Headers {
  return new Headers(existing || {});
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { auth = false, body, headers: incomingHeaders, ...rest } = options;

  const headers = buildHeaders(incomingHeaders);

  let resolvedBody: BodyInit | undefined;
  if (typeof body !== "undefined") {
    if (body instanceof FormData || typeof body === "string") {
      resolvedBody = body;
    } else {
      headers.set("content-type", "application/json");
      resolvedBody = JSON.stringify(body);
    }
  }

  if (auth) {
    const token = getAccessToken();
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers,
    body: resolvedBody,
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload !== null && "error" in payload
        ? String((payload as { error: unknown }).error)
        : `Request failed with status ${response.status}`;

    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}
