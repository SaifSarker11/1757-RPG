/**
 * Which sites may call the game server, over HTTP and over the live socket.
 *
 * Only this project's own deployed origins pass, plus anything the operator
 * adds through EXTRA_ALLOWED_ORIGINS. Wildcards are limited to a single DNS
 * label (the substituted part can never contain a dot), so
 * "*-saifsarker11s-projects.vercel.app" matches every preview URL of that one
 * Vercel team and nothing else. A bare "*.vercel.app" or "*.onrender.com"
 * would let anyone host a page that makes credentialed requests on a signed-in
 * player's behalf, so those are never allowed.
 */

const isProd = process.env.NODE_ENV === "production";

export const allowedOrigins: string[] = [
  process.env.WEB_URL,
  process.env.ADMIN_URL,
  // The game's own Vercel deployments: production alias plus every preview or
  // branch URL under the owner's team scope.
  "https://1757-web-rpg.vercel.app",
  "https://1757-admin-rpg.vercel.app",
  "https://*-saifsarker11s-projects.vercel.app",
  // The game's own Render deployment (the site served from Render itself).
  "https://1757-web.onrender.com",
  ...(process.env.EXTRA_ALLOWED_ORIGINS ?? "").split(","),
  ...(isProd ? [] : ["http://localhost:3000", "http://localhost:3002"]),
]
  .map((o) => o?.trim().replace(/\/+$/, ""))
  .filter((o): o is string => Boolean(o));

/** Exact match, or a "*" wildcard that only spans one DNS label's characters (no dots). */
export function matchesOrigin(pattern: string, origin: string): boolean {
  if (!pattern.includes("*")) return pattern === origin;
  const re = new RegExp(
    "^" + pattern.split("*").map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("[a-z0-9-]+") + "$"
  );
  return re.test(origin);
}

export function isDevLanOrigin(origin: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(
    origin
  );
}

/** Same rule for HTTP and sockets: the configured apps, plus LAN addresses in development. */
export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  if (allowedOrigins.some((allowed) => matchesOrigin(allowed, origin))) return true;
  // Only explicit origins pass (WEB_URL, ADMIN_URL, EXTRA_ALLOWED_ORIGINS). Trusting every
  // *.vercel.app site let anyone host a page there and make credentialed requests.
  return !isProd && isDevLanOrigin(origin);
}
