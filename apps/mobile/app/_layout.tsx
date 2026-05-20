import { Stack } from "expo-router";
import { useEffect } from "react";
import { initializeAuthClient } from "@/lib/auth-client";

export default function RootLayout() {
  useEffect(() => {
    void initializeAuthClient();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="home" />
    </Stack>
  );
}
