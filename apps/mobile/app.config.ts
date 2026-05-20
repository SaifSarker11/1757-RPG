import "@repo/config/load-env";
import type { ExpoConfig, ConfigContext } from "expo/config";

const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "1757 Mobile",
  slug: "1757-mobile",
  scheme: "1757",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  plugins: ["expo-router", "expo-secure-store"],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiUrl,
  },
});
