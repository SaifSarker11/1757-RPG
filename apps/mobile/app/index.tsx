import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  Dimensions,
  Platform,
  ScrollView,
  Linking,
} from "react-native";
import Svg, { Polygon, Line, Circle, Path } from "react-native-svg";
import { getApiUrl } from "@/lib/api-url";
import { authClient } from "@/lib/auth-client";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function LoginScreen() {
  const { data: session, isPending } = authClient.useSession();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isPending && session) {
      router.replace("/home");
    }
  }, [isPending, session]);

  async function handleGoogleLogin() {
    setLoading(true);
    setError(null);

    try {
      // Direct user to Fastify API server's Google Auth endpoint
      const authUrl = `${getApiUrl()}/api/auth/login/google?callbackURL=${getApiUrl()}/api/auth/callback/google`;
      await Linking.openURL(authUrl);
    } catch {
      setError("Failed to open Google authentication browser.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGuestLogin() {
    setLoading(true);
    setError(null);

    try {
      const { error: guestError } = await authClient.signIn.anonymous();

      if (guestError) {
        setError(guestError.message ?? "Unable to continue as guest");
        return;
      }

      router.replace("/home");
    } catch {
      setError(
        `Cannot reach API at ${getApiUrl()}. Is "pnpm --filter api dev" running?`
      );
    } finally {
      setLoading(false);
    }
  }

  // Generate dynamic background grid lines
  const renderGridLines = () => {
    const lines = [];
    const gridSize = 32;
    // vertical
    for (let x = gridSize; x < screenWidth; x += gridSize) {
      lines.push(
        <Line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={screenHeight}
          stroke="#2e282a"
          strokeWidth={1}
          opacity={0.06}
        />
      );
    }
    // horizontal
    for (let y = gridSize; y < screenHeight; y += gridSize) {
      lines.push(
        <Line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={screenWidth}
          y2={y}
          stroke="#2e282a"
          strokeWidth={1}
          opacity={0.06}
        />
      );
    }
    return lines;
  };

  // Generate diagonal warning stripes for the header
  const renderDiagonalHeaderStripes = () => {
    const stripes = [];
    const stripeWidth = 14;
    const gap = 14;
    const total = screenWidth + 40;
    for (let x = -40; x < total; x += stripeWidth + gap) {
      stripes.push(
        <Path
          key={x}
          d={`M${x},20 L${x + 14},0 L${x + 24},0 L${x + 10},20 Z`}
          fill="#2e282a"
          opacity={0.15}
        />
      );
    }
    return stripes;
  };

  if (isPending) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2e282a" />
      </View>
    );
  }

  const isMonospace = Platform.OS === "ios" ? "Courier" : "monospace";

  return (
    <View style={styles.container}>
      {/* Background Tech Grid */}
      <View style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%">
          {renderGridLines()}
        </Svg>
      </View>

      {/* Decorative screen border crosshairs for Y2K/Vectorheart feel */}
      <Text style={[styles.cornerText, { top: 32, left: 16, fontFamily: isMonospace }]}>+ LOC_0.1.7.5.7 // ACCESS</Text>
      <Text style={[styles.cornerText, { top: 32, right: 16, fontFamily: isMonospace }]}>[SYS_OK] +</Text>
      <Text style={[styles.cornerText, { bottom: 16, left: 16, fontFamily: isMonospace }]}>+ 1757_MOBILE_V2</Text>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Neobrutalist Shadow Container Card */}
        <View style={styles.cardShadowWrapper}>
          <View style={styles.cardShadowOffset} />
          
          <View style={styles.card}>
            {/* Diagonal Striped Banner */}
            <View style={styles.diagonalHeader}>
              <Svg width="100%" height={20}>
                {renderDiagonalHeaderStripes()}
              </Svg>
              <View style={styles.diagonalHeaderTextRow}>
                <Text style={[styles.diagonalHeaderText, { fontFamily: isMonospace }]}>PORTAL_SECURITY: OAUTH_GUEST</Text>
                <Text style={[styles.diagonalHeaderText, { fontFamily: isMonospace }]}>V2</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              {/* Geometric Custom Svg Heart */}
              <View style={styles.heartContainer}>
                <Svg viewBox="0 0 100 100" width={90} height={90}>
                  <Polygon
                    points="50,90 12,52 12,24 34,10 50,26 66,10 88,24 88,52"
                    fill="#ff5252"
                    stroke="#2e282a"
                    strokeWidth={4.5}
                  />
                  <Line x1="50" y1="26" x2="50" y2="90" stroke="#2e282a" strokeWidth={2} strokeDasharray="3,3" opacity={0.3} />
                  <Line x1="12" y1="42" x2="88" y2="42" stroke="#2e282a" strokeWidth={2} strokeDasharray="3,3" opacity={0.3} />
                  <Circle cx="50" cy="42" r="5.5" fill="#2e282a" />
                  <Path d="M22,18 L28,18 L28,24" fill="none" stroke="#2e282a" strokeWidth={2} opacity={0.5} />
                  <Path d="M78,18 L72,18 L72,24" fill="none" stroke="#2e282a" strokeWidth={2} opacity={0.5} />
                </Svg>
                
                {/* Tech corner frame brackets */}
                <View style={styles.bracketTL} />
                <View style={styles.bracketTR} />
                <View style={styles.bracketBL} />
                <View style={styles.bracketBR} />
              </View>

              {/* Title Section */}
              <View style={styles.titleContainer}>
                <Text style={[styles.title, { fontFamily: isMonospace }]}>1757 // RPG</Text>
                <Text style={[styles.subtitle, { fontFamily: isMonospace }]}>social deduction game</Text>
              </View>

              {/* Input Forms */}
              <View style={styles.form}>
                {error ? (
                  <View style={styles.errorBox}>
                    <Text style={[styles.errorText, { fontFamily: isMonospace }]}>{error}</Text>
                  </View>
                ) : null}

                {/* Google Sign In Button */}
                <Pressable
                  style={({ pressed }) => [
                    styles.googleButton,
                    pressed && styles.buttonPressed,
                    loading && styles.buttonDisabled,
                  ]}
                  onPress={handleGoogleLogin}
                  disabled={loading}
                >
                  <View style={styles.googleButtonContent}>
                    {/* Google Logo SVG replica */}
                    <Svg viewBox="0 0 24 24" width={18} height={18} style={{ marginRight: 10 }}>
                      <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                      <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                    </Svg>
                    <Text style={[styles.googleButtonText, { fontFamily: isMonospace }]}>
                      {loading ? "INITIALIZING..." : "SIGN IN WITH GOOGLE"}
                    </Text>
                  </View>
                </Pressable>

                {/* Divider */}
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={[styles.dividerText, { fontFamily: isMonospace }]}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Secondary Button */}
                <Pressable
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed && styles.buttonPressed,
                    loading && styles.buttonDisabled,
                  ]}
                  onPress={handleGuestLogin}
                  disabled={loading}
                >
                  <Text style={[styles.secondaryButtonText, { fontFamily: isMonospace }]}>
                    CONTINUE AS GUEST
                  </Text>
                </Pressable>

                <Text style={[styles.decalLabel, { fontFamily: isMonospace }]}>
                  [ SECURE ACCESS PORTAL ]
                </Text>
              </View>
            </View>

            {/* Bottom Accent */}
            <View style={styles.diagonalFooter}>
              <Svg width="100%" height={12}>
                {renderDiagonalHeaderStripes()}
              </Svg>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f4f0e6",
  },
  container: {
    flex: 1,
    backgroundColor: "#f4f0e6",
    paddingHorizontal: 20,
  },
  cornerText: {
    position: "absolute",
    fontSize: 9,
    fontWeight: "bold",
    color: "#2e282a",
    opacity: 0.35,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  cardShadowWrapper: {
    position: "relative",
    width: "100%",
    maxWidth: 380,
  },
  cardShadowOffset: {
    position: "absolute",
    top: 6,
    left: 6,
    right: -6,
    bottom: -6,
    backgroundColor: "#2e282a",
    borderWidth: 4,
    borderColor: "#2e282a",
  },
  card: {
    backgroundColor: "#ffffff",
    borderWidth: 4,
    borderColor: "#2e282a",
    overflow: "hidden",
  },
  diagonalHeader: {
    borderBottomWidth: 4,
    borderBottomColor: "#2e282a",
    backgroundColor: "#f4f0e6",
  },
  diagonalHeaderTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingBottom: 4,
    marginTop: -4,
  },
  diagonalHeaderText: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#2e282a",
    opacity: 0.8,
  },
  cardBody: {
    padding: 24,
  },
  heartContainer: {
    position: "relative",
    marginBottom: 16,
    marginTop: 4,
    alignSelf: "center",
    padding: 8,
  },
  bracketTL: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 14,
    height: 14,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderColor: "#2e282a",
    opacity: 0.5,
  },
  bracketTR: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 14,
    height: 14,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
    borderColor: "#2e282a",
    opacity: 0.5,
  },
  bracketBL: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 14,
    height: 14,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
    borderColor: "#2e282a",
    opacity: 0.5,
  },
  bracketBR: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
    borderColor: "#2e282a",
    opacity: 0.5,
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#2e282a",
    textAlign: "center",
    textTransform: "uppercase",
  },
  subtitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#2e282a",
    opacity: 0.6,
    textAlign: "center",
    textTransform: "uppercase",
    marginTop: 2,
  },
  form: {
    gap: 16,
  },
  errorBox: {
    borderWidth: 2,
    borderColor: "#dc2626",
    backgroundColor: "#fef2f2",
    padding: 10,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "center",
  },
  googleButton: {
    backgroundColor: "#ffffff",
    borderWidth: 2.5,
    borderColor: "#2e282a",
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2e282a",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
    marginTop: 4,
  },
  googleButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  googleButtonText: {
    color: "#2e282a",
    fontWeight: "900",
    fontSize: 13,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#2e282a",
    opacity: 0.15,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#2e282a",
    marginHorizontal: 10,
    opacity: 0.65,
  },
  secondaryButton: {
    backgroundColor: "#ef9fbc", // Retro primary pink
    borderWidth: 2.5,
    borderColor: "#2e282a",
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2e282a",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  secondaryButtonText: {
    color: "#2e282a",
    fontWeight: "900",
    fontSize: 13,
  },
  buttonPressed: {
    transform: [{ translateX: 1.5 }, { translateY: 1.5 }],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  decalLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#2e282a",
    opacity: 0.35,
    textAlign: "center",
    marginTop: 8,
  },
  diagonalFooter: {
    borderTopWidth: 4,
    borderTopColor: "#2e282a",
    backgroundColor: "#f4f0e6",
  },
});
