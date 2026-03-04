// frontend/src/services/http.ts
import { getToken, clearToken } from "../utils/authStorage";

const BASE =
  (import.meta.env.VITE_API_BASE_URL as string) || "http://127.0.0.1:5179";

function authHeaders(extra: HeadersInit = {}) {
  const token = getToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

function redirectToLogin() {
  // tránh loop nếu đang ở login
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/login") return;

  // giữ lại page đang đứng để sau này có thể quay lại (optional)
  const from = window.location.pathname + window.location.search;
  const qs = new URLSearchParams({ from }).toString();
  window.location.href = `/login?${qs}`;
}

/**
 * Read response body safely (json/text) and build a readable error message.
 * If unauthorized -> clear token + redirect to /login.
 */
async function parseOrThrow(res: Response, url: string): Promise<Response> {
  if (res.ok) return res;

  // default message
  let msg = `HTTP ${res.status}`;

  // try json first
  try {
    const data = await res.clone().json();
    if (data?.message) msg = String(data.message);
    else if (data?.error) msg = String(data.error);
  } catch {
    // fallback to text
    try {
      const text = await res.clone().text();
      if (text) msg = text;
    } catch {
      // ignore
    }
  }

  // If unauthorized/forbidden, clear token & redirect (except login endpoint)
  if ((res.status === 401 || res.status === 403) && !url.includes("/auth/login")) {
    try {
      clearToken();
    } catch {
      // ignore
    }
    redirectToLogin();
  }

  throw new Error(msg);
}

function buildUrl(path: string) {
  if (!path) return BASE;
  // allow absolute URLs
  if (/^https?:\/\//i.test(path)) return path;
  // ensure slash
  if (path.startsWith("/")) return `${BASE}${path}`;
  return `${BASE}/${path}`;
}

export async function getJson<T = any>(path: string, init: RequestInit = {}) {
  const url = buildUrl(path);
  const res = await fetch(url, {
    ...init,
    method: "GET",
    headers: authHeaders({
      Accept: "application/json",
      ...(init.headers || {}),
    }),
  });
  await parseOrThrow(res, url);

  const text = await res.text();
  if (!text) return null as any;

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as any as T;
  }
}

export async function postJson<T = any>(
  path: string,
  body?: any,
  init: RequestInit = {}
) {
  const url = buildUrl(path);
  const res = await fetch(url, {
    ...init,
    method: "POST",
    headers: authHeaders({
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init.headers || {}),
    }),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  await parseOrThrow(res, url);

  const text = await res.text();
  if (!text) return null as any;

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as any as T;
  }
}

export async function putJson<T = any>(
  path: string,
  body?: any,
  init: RequestInit = {}
) {
  const url = buildUrl(path);
  const res = await fetch(url, {
    ...init,
    method: "PUT",
    headers: authHeaders({
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init.headers || {}),
    }),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  await parseOrThrow(res, url);

  const text = await res.text();
  if (!text) return null as any;

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as any as T;
  }
}

export async function patchJson<T = any>(
  path: string,
  body?: any,
  init: RequestInit = {}
) {
  const url = buildUrl(path);
  const res = await fetch(url, {
    ...init,
    method: "PATCH",
    headers: authHeaders({
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init.headers || {}),
    }),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  await parseOrThrow(res, url);

  const text = await res.text();
  if (!text) return null as any;

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as any as T;
  }
}

/**
 * Keep delJson as requested. Some backends return 204 No Content.
 * We return null for empty body.
 */
export async function delJson<T = any>(path: string, init: RequestInit = {}) {
  const url = buildUrl(path);
  const res = await fetch(url, {
    ...init,
    method: "DELETE",
    headers: authHeaders({
      Accept: "application/json",
      ...(init.headers || {}),
    }),
  });
  await parseOrThrow(res, url);

  const text = await res.text();
  if (!text) return null as any;

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as any as T;
  }
}
