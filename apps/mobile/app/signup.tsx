import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View, Platform } from "react-native";

export default function SignupScreen() {
  useEffect(() => {
    router.replace("/");
  }, []);

  const isMonospace = Platform.OS === "ios" ? "Courier" : "monospace";

  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color="#2e282a" />
      <Text style={[styles.text, { fontFamily: isMonospace }]}>Redirecting to login...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f0e6",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  text: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#2e282a",
    opacity: 0.6,
  },
});
