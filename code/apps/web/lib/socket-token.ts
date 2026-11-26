/**
 * Fetches the Better Auth session token for the Socket.IO handshake.
 *
 * Why this exists: with the web client on Vercel and the API on Render, the
 * Better Auth cookie is set on the *web* origin (auth runs behind the Next.js
 * rewrite proxy, so the browser stores it for the Vercel domain). The socket
 * connects to the *API* origin directly (NEXT_PUBLIC_WS_URL), where that
 * cookie is not visible, so the handshake would arrive unauthenticated and
 * every room/game event would be refused.
 *
 * The API's socket middleware accepts a Bearer token (Better Auth `bearer`
 * plugin converts it into a session), so we fetch the current session token
 * from `/api/me` — same-origin through the rewrite proxy, cookie
 * authenticated — and hand it to the socket handshake. Socket.IO calls the
 * `auth` callback on every (re)connect attempt, so a fresh token is fetched
 * each time and the connection self-heals after a session refresh.
 */
export async function fetchSocketToken(): Promise<string | undefined> {
  try {
    const res = await fetch("/api/me", { credentials: "include" });
    if (!res.ok) return undefined;
    const data = (await res.json()) as {
      session?: { token?: string | null } | null;
    };
    return data?.session?.token ?? undefined;
  } catch {
    return undefined;
  }
}
