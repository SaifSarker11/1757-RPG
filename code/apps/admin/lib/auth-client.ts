import { createAuthClient } from "better-auth/react";
import { anonymousClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : "http://localhost:3002",
  plugins: [anonymousClient()],
  fetchOptions: {
    credentials: "include",
  },
});
