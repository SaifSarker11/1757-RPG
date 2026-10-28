import { createAuthClient } from "better-auth/react";
import { anonymousClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.WEB_URL ?? "http://localhost:3000"),
  plugins: [anonymousClient()],
  fetchOptions: {
    credentials: "include",
  },
});
