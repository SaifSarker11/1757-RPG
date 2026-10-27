import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { anonymous, bearer } from "better-auth/plugins";
import { db } from "@repo/db";
import { generateGuestName } from "./guestName.js";

const trustedOrigins = [
  process.env.WEB_URL,
  process.env.ADMIN_URL,
  process.env.BETTER_AUTH_URL,
  "http://localhost:3000",
  "http://localhost:3002",
  "http://localhost:3001",
  "https://*.vercel.app",
].filter((url): url is string => Boolean(url));

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3001",
  trustedOrigins,
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
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
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    },
  },
  plugins: [anonymous({ generateName: generateGuestName }), bearer()],
});

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
