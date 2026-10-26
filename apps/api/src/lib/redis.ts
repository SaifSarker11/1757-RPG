import { Redis } from "ioredis";

export const DEFAULT_REDIS_URL = "redis://localhost:6379";

/**
 * TCP Redis client (plan §1). `REDIS_URL` is Docker Redis locally or the
 * Upstash `rediss://` endpoint in prod; ioredis turns on TLS for `rediss://`.
 * The Upstash REST API can't do pub/sub, so it isn't used here.
 */
export function createRedis(url = process.env.REDIS_URL ?? DEFAULT_REDIS_URL): Redis {
  return new Redis(url, {
    // Fail fast instead of queueing game writes forever while Redis is down.
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });
}
