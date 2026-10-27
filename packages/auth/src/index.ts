import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { anonymous, bearer } from "better-auth/plugins";
import { db } from "@repo/db";
import { generateGuestName } from "./guestName.js";

const trustedOrigins = [
  process.env.WEB_URL ?? "http://localhost:3000",
  process.env.ADMIN_URL ?? "http://localhost:3002",
  process.env.BETTER_AUTH_URL ?? "http://localhost:3001",
].filter(Boolean);

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
  advanced: process.env.COOKIE_DOMAIN
    ? {
        crossSubDomainCookies: {
          enabled: true,
          domain: process.env.COOKIE_DOMAIN,
        },
      }
    : undefined,
  plugins: [anonymous({ generateName: generateGuestName }), bearer()],
});

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
