import "@repo/config/load-env";
import { PrismaClient } from "./generated";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function isNeonDatabase(connectionString: string): boolean {
  return connectionString.includes("neon.tech");
}

async function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  // Use Neon adapter for serverless (WebSocket) connections
  if (isNeonDatabase(connectionString)) {
    const { neonConfig } = await import("@neondatabase/serverless");
    const { PrismaNeon } = await import("@prisma/adapter-neon");
    const ws = await import("ws");

    neonConfig.webSocketConstructor = ws.default;

    const adapter = new PrismaNeon({
      connectionString,
    });
    return new PrismaClient({ adapter });
  }

  // Use standard TCP connection for local PostgreSQL (Docker) or traditional databases
  return new PrismaClient();
}

export const db = globalForPrisma.prisma ?? (await createPrismaClient());

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

export type { Prisma } from "./generated";