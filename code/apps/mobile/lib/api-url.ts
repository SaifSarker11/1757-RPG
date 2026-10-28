import Constants from "expo-constants";
import { Platform } from "react-native";

const API_PORT = "3001";

/**
 * Resolve API base URL for the current device.
 * localhost only works on iOS simulator / web — not on physical devices or Android emulator.
 */
export function getApiUrl(): string {
  const fromEnv =
    process.env.EXPO_PUBLIC_API_URL ??
    (Constants.expoConfig?.extra?.apiUrl as string | undefined);

  // Android emulator: localhost on host machine is 10.0.2.2
  if (Platform.OS === "android" && fromEnv?.includes("localhost")) {
    return fromEnv.replace("localhost", "10.0.2.2");
  }

  // Expo Go on a physical device: use the same LAN IP as Metro (e.g. 192.168.0.102)
  const metroHost =
    Constants.expoConfig?.hostUri?.split(":")[0] ??
    Constants.expoGoConfig?.debuggerHost?.split(":")[0];

  if (
    metroHost &&
    fromEnv &&
    (fromEnv.includes("localhost") || fromEnv.includes("127.0.0.1"))
  ) {
    return `http://${metroHost}:${API_PORT}`;
  }

  if (fromEnv) return fromEnv;

  if (metroHost) return `http://${metroHost}:${API_PORT}`;

  return `http://localhost:${API_PORT}`;
}
