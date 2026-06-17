import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Modal,
  Dimensions,
} from "react-native";
import Svg, { Line, Path } from "react-native-svg";
import { io } from "socket.io-client";
import { authClient, signOutMobile } from "@/lib/auth-client";
import { getApiUrl } from "@/lib/api-url";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface ChatMessage {
  id: string;
  username: string;
  text: string;
  timestamp: string;
}

const QUICK_EMOJIS = ["😀", "😂", "😍", "🔥", "👍", "🚀", "🎉", "💯", "💡", "❤️", "✨", "👀"];

export default function HomeScreen() {
  const { data: session, isPending } = authClient.useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const socketRef = useRef<any>(null);
  const flatListRef = useRef<FlatList | null>(null);

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

  // Settings states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [nickname, setNickname] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/");
    }
  }, [isPending, session]);

  useEffect(() => {
    if (session?.user?.name) {
      setNickname(session.user.name);
    }
  }, [session, isSettingsOpen]);

  useEffect(() => {
    if (!session) return;

    const socketUrl = getApiUrl();
    const socket = io(socketUrl, {
      transports: ["websocket"],
      forceNew: true,
    });
    socketRef.current = socket;

    socket.on("chat:history", (history: ChatMessage[]) => {
      setMessages(history);
    });

    socket.on("chat:message", (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [session]);

  const handleSignOut = async () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    await signOutMobile();
    router.replace("/");
  };

  const handleSendMessage = () => {
    if (!inputText.trim() || !socketRef.current || !session?.user) return;

    socketRef.current.emit("chat:send-message", {
      username: session.user.name,
      text: inputText.trim(),
    });
    setInputText("");
  };

  const handleAddEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  const handleSaveNickname = async () => {
    if (!nickname.trim() || session?.user?.isAnonymous) return;
    setSaveLoading(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const { error: updateError } = await authClient.updateUser({
        name: nickname.trim(),
      });

      if (updateError) {
        setSaveError(updateError.message ?? "Unable to update nickname");
        return;
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsSettingsOpen(false);
      }, 1500);
      
      // Refresh session cache
      await authClient.useSession();
    } catch {
      setSaveError("Failed to update nickname. Server error.");
    } finally {
      setSaveLoading(false);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  if (isPending || !session) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: "#f4f0e6" }]}>
        <ActivityIndicator size="large" color="#2e282a" />
        <Text style={[styles.loadingText, { fontFamily: isMonospace, color: "#2e282a" }]}>SECURE_PROFILE: LOADING...</Text>
      </View>
    );
  }

  const isMonospace = Platform.OS === "ios" ? "Courier" : "monospace";

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: "#f4f0e6" }]}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: "#f4f0e6" }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Custom Header */}
        <View style={styles.header}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={[styles.headerTitle, { fontFamily: isMonospace }]}>1757 // RPG</Text>
            <Text style={[styles.headerSubtitle, { fontFamily: isMonospace }]}>
              AGENT_ID: <Text style={[styles.usernameHighlight, { fontFamily: isMonospace }]}>{session.user.name}</Text>
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable style={styles.settingsButton} onPress={() => setIsSettingsOpen(true)}>
              <Text style={[styles.settingsButtonText, { fontFamily: isMonospace }]}>Settings</Text>
            </Pressable>
            <Pressable style={styles.signOutButton} onPress={handleSignOut}>
              <Text style={[styles.signOutButtonText, { fontFamily: isMonospace }]}>Logout</Text>
            </Pressable>
          </View>
        </View>

        {/* Diagonal Warning Stripe Accent */}
        <View style={styles.diagonalStripeBar}>
          <Svg width="100%" height={10}>
            {renderDiagonalHeaderStripes()}
          </Svg>
        </View>

        {/* Messages List */}
        <View style={styles.chatArea}>
          {messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyIcon, { fontFamily: isMonospace }]}>💬</Text>
              <Text style={[styles.emptyTitle, { fontFamily: isMonospace }]}>COMMS_LOG: EMPTY</Text>
              <Text style={[styles.emptyText, { fontFamily: isMonospace }]}>Be the first to transmit a message!</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messageList}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
              renderItem={({ item }) => {
                const isOwnMessage = item.username === session.user.name;
                return (
                  <View
                    style={[
                      styles.messageRow,
                      isOwnMessage ? styles.ownMessageRow : styles.otherMessageRow,
                    ]}
                  >
                    {!isOwnMessage && (
                      <Text style={[styles.senderName, { fontFamily: isMonospace }]}>{item.username}</Text>
                    )}
                    <View
                      style={[
                        styles.messageBubble,
                        isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
                          { fontFamily: isMonospace },
                        ]}
                      >
                        {item.text}
                      </Text>
                    </View>
                    <Text style={[styles.timestamp, { fontFamily: isMonospace }]}>[{formatTime(item.timestamp)}]</Text>
                  </View>
                );
              }}
            />
          )}
        </View>

        {/* Quick Emoji Bar */}
        <View style={styles.emojiBarContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.emojiScroll}
          >
            <Text style={[styles.emojiBarLabel, { fontFamily: isMonospace }]}>QUICK_INPUT: </Text>
            {QUICK_EMOJIS.map((emoji) => (
              <Pressable
                key={emoji}
                style={styles.emojiButton}
                onPress={() => handleAddEmoji(emoji)}
              >
                <Text style={[styles.emojiText, { fontFamily: isMonospace }]}>{emoji}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Message Input Form */}
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.textInput, { fontFamily: isMonospace }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Transmit encrypted message..."
            placeholderTextColor="#a1a1aa"
            multiline
          />
          <Pressable
            style={({ pressed }) => [
              styles.sendButton,
              pressed && styles.buttonPressed,
              !inputText.trim() && styles.sendButtonDisabled
            ]}
            disabled={!inputText.trim()}
            onPress={handleSendMessage}
          >
            <Text style={[styles.sendButtonText, { fontFamily: isMonospace }]}>TRANSMIT</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Profile Settings Modal */}
      <Modal
        visible={isSettingsOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsSettingsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalShadowWrapper}>
            <View style={styles.modalShadowOffset} />
            
            <View style={styles.modalCard}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={[styles.modalHeaderText, { fontFamily: isMonospace }]}>
                  SYSTEM: SETTINGS // PROFILE
                </Text>
                <Pressable onPress={() => setIsSettingsOpen(false)}>
                  <Text style={[styles.modalCloseText, { fontFamily: isMonospace }]}>[X]</Text>
                </Pressable>
              </View>

              <View style={styles.modalBody}>
                <Text style={[styles.modalTitle, { fontFamily: isMonospace }]}>[ PROFILE SETTINGS ]</Text>

                <Text style={[styles.modalLabel, { fontFamily: isMonospace }]}>PLAYER NICKNAME</Text>
                <TextInput
                  style={[styles.modalInput, { fontFamily: isMonospace }]}
                  value={nickname}
                  onChangeText={setNickname}
                  editable={!session.user.isAnonymous}
                  placeholder="Enter nickname"
                  placeholderTextColor="#a1a1aa"
                  maxLength={25}
                />

                {session.user.isAnonymous && (
                  <Text style={[styles.warningText, { fontFamily: isMonospace }]}>
                    * Guest accounts cannot customize nicknames. Log in with Google to set a custom name.
                  </Text>
                )}

                {saveError && (
                  <View style={styles.errorBox}>
                    <Text style={[styles.errorText, { fontFamily: isMonospace }]}>ERROR: {saveError}</Text>
                  </View>
                )}

                {saveSuccess && (
                  <View style={styles.successBox}>
                    <Text style={[styles.successText, { fontFamily: isMonospace }]}>SUCCESS: PROFILE UPDATED</Text>
                  </View>
                )}

                <View style={styles.modalButtonsRow}>
                  <Pressable style={styles.modalCloseButton} onPress={() => setIsSettingsOpen(false)}>
                    <Text style={[styles.modalCloseButtonText, { fontFamily: isMonospace }]}>CLOSE</Text>
                  </Pressable>
                  
                  {!session.user.isAnonymous && (
                    <Pressable 
                      style={[
                        styles.modalSaveButton, 
                        (saveLoading || !nickname.trim() || nickname.trim() === session.user.name) && styles.saveButtonDisabled
                      ]} 
                      onPress={handleSaveNickname}
                      disabled={saveLoading || !nickname.trim() || nickname.trim() === session.user.name}
                    >
                      <Text style={[styles.modalSaveButtonText, { fontFamily: isMonospace }]}>
                        {saveLoading ? "SAVING..." : "SAVE"}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f0e6",
  },
  container: {
    flex: 1,
    backgroundColor: "#f4f0e6",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#f4f0e6",
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#2e282a",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 3,
    borderBottomColor: "#2e282a",
    backgroundColor: "#ffffff",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#2e282a",
    textTransform: "uppercase",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#2e282a",
    fontWeight: "bold",
    opacity: 0.65,
    marginTop: 2,
    textTransform: "uppercase",
  },
  usernameHighlight: {
    color: "#ef9fbc", // pink highlight
    fontWeight: "bold",
  },
  settingsButton: {
    borderWidth: 2,
    borderColor: "#2e282a",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  settingsButtonText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#2e282a",
    textTransform: "uppercase",
  },
  signOutButton: {
    borderWidth: 2,
    borderColor: "#2e282a",
    backgroundColor: "#fca5a5", // neon red background
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  signOutButtonText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#2e282a",
    textTransform: "uppercase",
  },
  diagonalStripeBar: {
    borderBottomWidth: 3,
    borderBottomColor: "#2e282a",
    backgroundColor: "#ffffff",
    height: 10,
  },
  chatArea: {
    flex: 1,
  },
  messageList: {
    padding: 16,
    gap: 12,
  },
  messageRow: {
    flexDirection: "column",
    marginVertical: 4,
  },
  ownMessageRow: {
    alignItems: "flex-end",
    alignSelf: "flex-end",
  },
  otherMessageRow: {
    alignItems: "flex-start",
    alignSelf: "flex-start",
  },
  senderName: {
    fontSize: 11,
    fontWeight: "900",
    color: "#2e282a",
    marginBottom: 4,
    marginLeft: 4,
    textTransform: "uppercase",
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: "#2e282a",
  },
  ownMessageBubble: {
    borderBottomRightRadius: 0,
    backgroundColor: "#ef9fbc", // Y2K pink primary
  },
  otherMessageBubble: {
    borderBottomLeftRadius: 0,
    backgroundColor: "#ffffff",
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
  },
  ownMessageText: {
    color: "#2e282a",
    fontWeight: "bold",
  },
  otherMessageText: {
    color: "#2e282a",
  },
  timestamp: {
    fontSize: 9,
    color: "#2e282a",
    opacity: 0.5,
    marginTop: 4,
    marginHorizontal: 4,
    textTransform: "uppercase",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#2e282a",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  emptyText: {
    fontSize: 12,
    color: "#2e282a",
    opacity: 0.6,
    textAlign: "center",
    textTransform: "uppercase",
  },
  emojiBarContainer: {
    borderTopWidth: 2,
    borderTopColor: "#2e282a",
    backgroundColor: "#ffffff",
    paddingVertical: 8,
  },
  emojiScroll: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  emojiBarLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#2e282a",
    marginRight: 6,
    textTransform: "uppercase",
  },
  emojiButton: {
    padding: 6,
    marginHorizontal: 2,
  },
  emojiText: {
    fontSize: 18,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderTopWidth: 3,
    borderTopColor: "#2e282a",
    backgroundColor: "#ffffff",
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#2e282a",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    fontSize: 13,
    color: "#2e282a",
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "#ef9fbc",
    borderWidth: 2,
    borderColor: "#2e282a",
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: "#2e282a",
    fontWeight: "900",
    fontSize: 12,
  },
  // Modal Styling
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(46, 40, 42, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalShadowWrapper: {
    position: "relative",
    width: "100%",
    maxWidth: 320,
  },
  modalShadowOffset: {
    position: "absolute",
    top: 5,
    left: 5,
    right: -5,
    bottom: -5,
    backgroundColor: "#2e282a",
    borderWidth: 3,
    borderColor: "#2e282a",
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderWidth: 3,
    borderColor: "#2e282a",
    overflow: "hidden",
  },
  modalHeader: {
    backgroundColor: "#f4f0e6",
    borderBottomWidth: 3,
    borderBottomColor: "#2e282a",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  modalHeaderText: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#2e282a",
  },
  modalCloseText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#2e282a",
    paddingHorizontal: 4,
  },
  modalBody: {
    padding: 16,
    gap: 10,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#2e282a",
    textAlign: "center",
    marginBottom: 6,
  },
  modalLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#2e282a",
    opacity: 0.85,
  },
  modalInput: {
    borderWidth: 2,
    borderColor: "#2e282a",
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: "#2e282a",
  },
  warningText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#ca8a04",
    lineHeight: 12,
  },
  errorBox: {
    borderWidth: 2,
    borderColor: "#dc2626",
    backgroundColor: "#fef2f2",
    padding: 6,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
  },
  successBox: {
    borderWidth: 2,
    borderColor: "#16a34a",
    backgroundColor: "#f0fdf4",
    padding: 6,
  },
  successText: {
    color: "#16a34a",
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
  },
  modalButtonsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 8,
  },
  modalCloseButton: {
    borderWidth: 2,
    borderColor: "#2e282a",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
  },
  modalCloseButtonText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#2e282a",
  },
  modalSaveButton: {
    borderWidth: 2,
    borderColor: "#2e282a",
    backgroundColor: "#ef9fbc",
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
  },
  modalSaveButtonText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#2e282a",
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
});
