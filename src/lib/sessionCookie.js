const SESSION_COOKIE = "tw_session_hint";

export function writeSessionCookie(tableCode, displayName, avatarKey) {
  try {
    const val = encodeURIComponent(JSON.stringify({ tableCode, displayName, avatarKey }));
    document.cookie = `${SESSION_COOKIE}=${val}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  } catch {}
}

export function readSessionCookie(tableCode) {
  try {
    const match = document.cookie.split("; ").find((c) => c.startsWith(`${SESSION_COOKIE}=`));
    if (!match) return null;
    const parsed = JSON.parse(decodeURIComponent(match.split("=").slice(1).join("=")));
    if (tableCode && parsed?.tableCode !== tableCode) return null;
    return parsed;
  } catch { return null; }
}
