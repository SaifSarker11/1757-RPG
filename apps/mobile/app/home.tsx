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
} from "react-native";
import { io } from "socket.io-client";
import { authClient, signOutMobile } from "@/lib/auth-client";
import { getApiUrl } from "@/lib/api-url";

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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={styles.loadingText}>Loading chat...</Text>
      </View>
    );
  }

  const isMonospace = Platform.OS === "ios" ? "Courier" : "monospace";

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Custom Header */}
        <View style={styles.header}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.headerTitle}>Welcome to 1757!</Text>
            <Text style={styles.headerSubtitle}>
              Logged in as: <Text style={styles.usernameHighlight}>{session.user.name}</Text>
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable style={styles.settingsButton} onPress={() => setIsSettingsOpen(true)}>
              <Text style={styles.settingsButtonText}>Settings</Text>
            </Pressable>
            <Pressable style={styles.signOutButton} onPress={handleSignOut}>
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            </Pressable>
          </View>
        </View>

        {/* Messages List */}
        <View style={styles.chatArea}>
          {messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptyText}>Be the first to start the conversation!</Text>
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
                      <Text style={styles.senderName}>{item.username}</Text>
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
                        ]}
                      >
                        {item.text}
                      </Text>
                    </View>
                    <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
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
            <Text style={styles.emojiBarLabel}>QUICK: </Text>
            {QUICK_EMOJIS.map((emoji) => (
              <Pressable
                key={emoji}
                style={styles.emojiButton}
                onPress={() => handleAddEmoji(emoji)}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Message Input Form */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your message..."
            placeholderTextColor="#a1a1aa"
            multiline
          />
          <Pressable
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            disabled={!inputText.trim()}
            onPress={handleSendMessage}
          >
            <Text style={styles.sendButtonText}>Send</Text>
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
    backgroundColor: "#f4f4f5",
  },
  container: {
    flex: 1,
    backgroundColor: "#f4f4f5",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#f4f4f5",
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#71717a",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e7",
    backgroundColor: "#ffffff",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#7c3aed",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#71717a",
    fontWeight: "500",
    marginTop: 2,
  },
  usernameHighlight: {
    color: "#7c3aed",
    fontWeight: "600",
  },
  settingsButton: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    backgroundColor: "#f4f4f5",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  settingsButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#71717a",
  },
  signOutButton: {
    borderWidth: 1,
    borderColor: "#fca5a5",
    backgroundColor: "#fef2f2",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  signOutButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ef4444",
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
    fontWeight: "600",
    color: "#71717a",
    marginBottom: 4,
    marginLeft: 4,
  },
  messageBubble: {
    maxWidth: "80%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  ownMessageBubble: {
    borderBottomRightRadius: 0,
    backgroundColor: "#7c3aed",
  },
  otherMessageBubble: {
    borderBottomLeftRadius: 0,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4e4e7",
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  ownMessageText: {
    color: "#ffffff",
  },
  otherMessageText: {
    color: "#18181b",
  },
  timestamp: {
    fontSize: 9,
    color: "#a1a1aa",
    marginTop: 4,
    marginHorizontal: 4,
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
    fontWeight: "700",
    color: "#18181b",
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    color: "#71717a",
    textAlign: "center",
  },
  emojiBarContainer: {
    borderTopWidth: 1,
    borderTopColor: "#e4e4e7",
    backgroundColor: "#f4f4f5",
    paddingVertical: 8,
  },
  emojiScroll: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  emojiBarLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#a1a1aa",
    marginRight: 6,
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
    borderTopWidth: 1,
    borderTopColor: "#e4e4e7",
    backgroundColor: "#ffffff",
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    fontSize: 14,
    color: "#18181b",
    backgroundColor: "#fafafa",
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "#7c3aed",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
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
