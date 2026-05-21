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

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/");
    }
  }, [isPending, session]);

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Custom Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Welcome to 1757!</Text>
            <Text style={styles.headerSubtitle}>
              Logged in as: <Text style={styles.usernameHighlight}>{session.user.name}</Text>
            </Text>
          </View>
          <Pressable style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </Pressable>
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
});
