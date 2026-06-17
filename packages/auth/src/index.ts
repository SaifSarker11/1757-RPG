import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { anonymous, bearer } from "better-auth/plugins";
import { db } from "@repo/db";

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
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
  advanced: process.env.COOKIE_DOMAIN
    ? {
        crossSubDomainCookies: {
          enabled: true,
          domain: process.env.COOKIE_DOMAIN,
        },
      }
    : undefined,
  plugins: [
    anonymous({
      generateName: () => {
        const adjectives = [
          "Sleepy", "Brave", "Clumsy", "Sneaky", "Glorious", "Confused", 
          "Tactical", "Greedy", "Loyal", "Traitorous", "Sly", "Dramatic", 
          "Silent", "Rowdy", "Caffeinated", "Defiant"
        ];
        const nouns = [
          "Sepoy", "General", "Nawab", "Merchant", "Spy", "Soldier", 
          "Diplomat", "Baker", "Lancer", "Elephant", "Cannon", "Ghost", 
          "Duellist", "Scout", "Conspirator", "Scribe"
        ];
        const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        return `${adjective}${noun}_${Math.floor(Math.random() * 999) + 1}`;
      },
    }),
    bearer(),
  ],
});

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
