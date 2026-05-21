"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { authClient } from "@/lib/auth-client";

interface ChatMessage {
  id: string;
  username: string;
  text: string;
  timestamp: string;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3001";

export default function HomePage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const quickEmojis = ["😀", "😂", "😍", "🔥", "👍", "🚀", "🎉", "💯", "💡", "❤️", "✨", "👀"];

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/login");
    }
  }, [isPending, session, router]);

  useEffect(() => {
    if (!session) return;

    // Establish WebSocket connection to the Fastify server
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    // Listen for past message history
    socket.on("chat:history", (history: ChatMessage[]) => {
      setMessages(history);
    });

    // Listen for new incoming messages
    socket.on("chat:message", (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.disconnect();
    };
  }, [session]);

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSignOut() {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socketRef.current || !session?.user) return;

    // Emit the message event to server
    socketRef.current.emit("chat:send-message", {
      username: session.user.name,
      text: inputText,
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
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent"></div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Loading your profile...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-linear-to-b from-zinc-50 via-slate-100 to-zinc-200 text-zinc-900 dark:from-zinc-950 dark:via-zinc-900 dark:to-slate-950 dark:text-zinc-100">
      {/* Header Bar */}
      <header className="sticky top-0 z-10 border-b border-zinc-200/50 bg-white/70 backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-900/70">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex flex-col">
            <h1 className="bg-linear-to-r from-violet-600 to-indigo-600 bg-clip-text text-2xl font-extrabold text-transparent dark:from-violet-400 dark:to-indigo-400">
              Welcome to 1757!
            </h1>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Logged in as: <span className="text-violet-600 dark:text-violet-400">{session.user.name}</span>
            </p>
          </div>
          <button
            className="rounded-xl border border-red-200 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-600 transition-all hover:bg-red-500 hover:text-white dark:border-red-950 dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-600"
            type="button"
            onClick={handleSignOut}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Chat Container */}
      <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col p-4 md:py-6">
        <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-200/60 bg-white/80 shadow-xl backdrop-blur-xs dark:border-zinc-800/60 dark:bg-zinc-900/80">
          
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-3 rounded-full bg-violet-100 p-3 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400">
                  💬
                </div>
                <h3 className="text-lg font-bold">No messages yet</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Be the first to start the conversation!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {messages.map((msg) => {
                  const isOwnMessage = msg.username === session.user.name;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"}`}
                    >
                      {/* Sender username */}
                      {!isOwnMessage && (
                        <span className="mb-1 ml-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                          {msg.username}
                        </span>
                      )}
                      
                      {/* Message Bubble */}
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-xs break-words ${
                          isOwnMessage
                            ? "rounded-tr-none bg-linear-to-tr from-violet-600 to-indigo-600 text-white"
                            : "rounded-tl-none bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                        }`}
                      >
                        <p>{msg.text}</p>
                      </div>

                      {/* Timestamp */}
                      <span className="mt-1 px-1 text-[10px] text-zinc-400 dark:text-zinc-500">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Quick Emoji Toolbar */}
          <div className="flex items-center gap-2 overflow-x-auto border-t border-zinc-200/50 bg-zinc-50/50 px-4 py-2 select-none dark:border-zinc-800/50 dark:bg-zinc-900/50">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Quick:</span>
            {quickEmojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleAddEmoji(emoji)}
                className="rounded-md p-1 text-base transition-transform hover:scale-125 active:scale-95"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Message Input Form */}
          <form
            onSubmit={handleSendMessage}
            className="flex gap-2 border-t border-zinc-200/60 bg-zinc-50/70 p-4 dark:border-zinc-800/60 dark:bg-zinc-900/70"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-violet-600"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="flex items-center justify-center rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white transition-all hover:bg-violet-700 disabled:opacity-50 active:scale-95 shadow-md shadow-violet-500/20"
            >
              Send
            </button>
          </form>

        </div>
      </section>
    </main>
  );
}
