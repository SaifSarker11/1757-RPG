import { createAuthClient } from "better-auth/react";
import { anonymousClient } from "better-auth/client/plugins";
import { getApiUrl } from "./api-url";
import {
  clearAuthToken,
  getCachedAuthToken,
  loadAuthToken,
  saveAuthToken,
} from "./token-storage";

const apiUrl = getApiUrl();

export const authClient = createAuthClient({
  baseURL: apiUrl,
  plugins: [anonymousClient()],
  fetchOptions: {
    auth: {
      type: "Bearer",
      token: () => getCachedAuthToken(),
    },
    onSuccess: async (ctx) => {
      const token = ctx.response.headers.get("set-auth-token");
      if (token) {
        await saveAuthToken(token);
      }
    },
  },
});

export async function initializeAuthClient() {
  await loadAuthToken();
}

export async function signOutMobile() {
  await authClient.signOut();
  await clearAuthToken();
}
