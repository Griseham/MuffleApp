const LOCAL_BACKEND_PORT = "8080";

function getDefaultApiOrigin() {
  if (typeof window === "undefined") {
    return `http://localhost:${LOCAL_BACKEND_PORT}`;
  }

  const { protocol, hostname, origin, port } = window.location;
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";

  if (isLocalhost && port !== LOCAL_BACKEND_PORT) {
    return `${protocol}//${hostname}:${LOCAL_BACKEND_PORT}`;
  }

  return origin;
}

const DEFAULT_API_ORIGIN = getDefaultApiOrigin();

export function getApiOrigin() {
  const rawValue = String(import.meta.env.VITE_API_BASE_URL || DEFAULT_API_ORIGIN).trim();
  const normalizedValue = rawValue.replace(/\/+$/, "");

  if (!normalizedValue) {
    return DEFAULT_API_ORIGIN;
  }

  return normalizedValue.replace(/\/api$/i, "");
}

export function buildApiUrl(path = "") {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = String(path).trim();
  const prefixedPath = normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`;
  const apiPath = prefixedPath === "/api" || prefixedPath.startsWith("/api/")
    ? prefixedPath
    : `/api${prefixedPath}`;

  return `${getApiOrigin()}${apiPath}`;
}

export function toApiOriginUrl(path = "") {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = String(path).trim();
  if (!normalizedPath) {
    return getApiOrigin();
  }

  return `${getApiOrigin()}${normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`}`;
}
