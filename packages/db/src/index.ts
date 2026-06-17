import "@repo/config/load-env";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "./generated/index.js";

neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  // Use Neon serverless adapter only if we are connecting to a Neon database
  if (connectionString.includes("neon.tech")) {
    const adapter = new PrismaNeon({
      connectionString,
    });
    return new PrismaClient({ adapter });
  }

  // For local PostgreSQL development, use direct TCP connection via PrismaPg adapter
  const pool = new pg.Pool({
    connectionString,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

export type { Prisma } from "./generated/index.js";
export { RoomStatus, PlayerTeam, PlayerRole } from "./generated/index.js";