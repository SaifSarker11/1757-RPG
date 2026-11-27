import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { anonymous, bearer } from "better-auth/plugins";
import { db } from "@repo/db";
import { generateGuestName } from "./guestName.js";

if (process.env.NODE_ENV === "production" && (process.env.BETTER_AUTH_SECRET ?? "").length < 32) {
  throw new Error("BETTER_AUTH_SECRET must be a random string of at least 32 characters in production");
}

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3001",
  // Only explicit origins are trusted. The old *.vercel.app wildcard plus disabled
  // origin/CSRF checks let any third-party site act on a signed-in player's behalf.
  trustedOrigins: [
    process.env.WEB_URL,
    process.env.ADMIN_URL,
    process.env.BETTER_AUTH_URL,
    // The game's own Vercel deployments: production alias plus every preview/branch URL
    // under the owner's team scope (only that Vercel team can create these hostnames).
    "https://1757-web-rpg.vercel.app",
    "https://1757-admin-rpg.vercel.app",
    "https://*-saifsarker11s-projects.vercel.app",
    ...(process.env.EXTRA_ALLOWED_ORIGINS ?? "").split(","),
    ...(process.env.NODE_ENV === "production"
      ? []
      : ["http://localhost:3000", "http://localhost:3002", "http://localhost:3001"]),
  ]
    .map((url) => url?.trim().replace(/\/+$/, ""))
    .filter((url): url is string => Boolean(url)),
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  rateLimit: { enabled: true, window: 60, max: 30 },
  advanced: {
    ...(process.env.COOKIE_DOMAIN
      ? {
          crossSubDomainCookies: {
            enabled: true,
            domain: process.env.COOKIE_DOMAIN,
          },
        }
      : {}),
    defaultCookieAttributes: {
      // Auth runs same-origin through the web app's rewrite proxy, so "lax" works and blocks CSRF.
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    },
  },
  plugins: [anonymous({ generateName: generateGuestName }), bearer()],
});

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
