// Cookie helpers used as a durable fallback when iOS Safari evicts localStorage
// for inactive tabs. Cookies survive that eviction.

const MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds

export function cookieGet(key) {
  if (typeof document === "undefined") return null;
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(new RegExp("(?:^|;\\s*)" + escaped + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

export function cookieSet(key, value) {
  if (typeof document === "undefined") return;
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${key}=${encodeURIComponent(value)}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax${secure}`;
}

export function cookieRemove(key) {
  if (typeof document === "undefined") return;
  document.cookie = `${key}=; Max-Age=0; Path=/; SameSite=Lax`;
}
