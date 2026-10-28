import * as SecureStore from "expo-secure-store";

const AUTH_TOKEN_KEY = "auth_bearer_token";

let cachedToken: string | null = null;

export async function loadAuthToken(): Promise<string | null> {
  if (cachedToken) {
    return cachedToken;
  }

  cachedToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  return cachedToken;
}

export async function saveAuthToken(token: string): Promise<void> {
  cachedToken = token;
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
}

export async function clearAuthToken(): Promise<void> {
  cachedToken = null;
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
}

export function getCachedAuthToken(): string {
  return cachedToken ?? "";
}
