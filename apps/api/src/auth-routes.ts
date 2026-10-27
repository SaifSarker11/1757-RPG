import type { FastifyInstance, FastifyRequest } from "fastify";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "@repo/auth";

function getRequestBody(request: FastifyRequest): string | undefined {
  if (request.method === "GET" || request.method === "HEAD") {
    return undefined;
  }

  const { body } = request;
  if (body === undefined || body === null) {
    return undefined;
  }

  if (typeof body === "string") {
    return body;
  }

  return JSON.stringify(body);
}

export async function registerAuthRoutes(app: FastifyInstance) {
  app.route({
    method: ["GET", "POST"],
    url: "/api/auth/*",
    async handler(request, reply) {
      try {
        const url = new URL(request.url, `http://${request.headers.host}`);
        const headers = fromNodeHeaders(request.headers);
        const body = getRequestBody(request);

        const req = new Request(url.toString(), {
          method: request.method,
          headers,
          body,
        });

        const response = await auth.handler(req);

        reply.status(response.status);
        if (typeof response.headers.getSetCookie === "function") {
          const setCookies = response.headers.getSetCookie();
          for (const cookie of setCookies) {
            reply.appendHeader("set-cookie", cookie);
          }
          response.headers.forEach((value, key) => {
            if (key.toLowerCase() !== "set-cookie") {
              reply.header(key, value);
            }
          });
        } else {
          response.headers.forEach((value, key) => {
            reply.header(key, value);
          });
        }

        const responseBody = await response.text();
        return reply.send(responseBody.length > 0 ? responseBody : null);
      } catch (error) {
        app.log.error(error, "Authentication handler error");
        return reply.status(500).send({
          error: "Internal authentication error",
          code: "AUTH_FAILURE",
        });
      }
    },
  });

  app.get("/api/me", async (request, reply) => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    if (!session) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    return reply.send(session);
  });
}
