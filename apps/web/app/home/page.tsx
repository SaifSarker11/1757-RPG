"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { authClient } from "@/lib/auth-client";
import { Settings, LogOut, ChevronDown, Send, MessageSquare } from "lucide-react";

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
  const [theme, setTheme] = useState<string>("retro");
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Settings states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [nickname, setNickname] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const quickEmojis = ["😀", "😂", "😍", "🔥", "👍", "🚀", "🎉", "💯", "💡", "❤️", "✨", "👀"];

  // Initialize theme from localStorage/document
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "retro";
    setTheme(savedTheme);
  }, []);

  // Initialize nickname when session or modal state updates
  useEffect(() => {
    if (session?.user?.name) {
      setNickname(session.user.name);
    }
  }, [session, isSettingsOpen]);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

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

  const handleSaveNickname = async (e: React.FormEvent) => {
    e.preventDefault();
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
      setTimeout(() => setSaveSuccess(false), 3000);
      
      // Refresh router & session cache
      router.refresh();
      await authClient.useSession();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to update profile");
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
      <main className="flex min-h-screen items-center justify-center bg-base-300 text-base-content">
        <div className="flex flex-col items-center gap-3 p-8 border-4 border-base-content bg-base-100 shadow-neo font-mono">
          <div className="h-10 w-10 animate-spin border-4 border-primary border-t-transparent"></div>
          <p className="text-sm font-bold uppercase tracking-wider">LOAD_PROFILE: RUNNING...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-grid-pattern bg-base-200 text-base-content scanlines">
      {/* Header Bar */}
      <header className="sticky top-0 z-10 border-b-4 border-base-content bg-base-100">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <div className="flex flex-col select-none">
            <h1 className="text-2xl font-black font-mono tracking-tight uppercase flex items-center gap-1">
              <span>1757</span>
              <span className="text-primary">//</span>
              <span className="text-secondary">RPG</span>
            </h1>
            <p className="text-[10px] font-mono font-bold tracking-widest uppercase text-base-content/60">
              AGENT: <span className="text-primary">{session.user.name}</span>
            </p>
          </div>
          
          {/* Header Controls */}
          <div className="flex items-center gap-3">
            {/* Profile Settings Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="btn btn-outline border-2 border-base-content font-mono text-xs uppercase shadow-neo-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo transition-all flex items-center gap-1.5 h-10 px-3 cursor-pointer"
              type="button"
            >
              <Settings size={14} className="animate-[spin_12s_linear_infinite]" />
              <span className="hidden sm:inline">Settings</span>
            </button>

            {/* Theme Selector Dropdown */}
            <div className="dropdown dropdown-end">
              <label 
                tabIndex={0} 
                className="btn btn-outline border-2 border-base-content font-mono text-xs uppercase shadow-neo-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo transition-all flex items-center gap-1.5 h-10 px-3 cursor-pointer"
              >
                <span className="hidden sm:inline">Theme:</span>
                <span className="text-primary font-black">{theme}</span>
                <ChevronDown size={12} className="opacity-60" />
              </label>
              <ul 
                tabIndex={0} 
                className="dropdown-content menu p-1.5 bg-base-100 border-2 border-base-content shadow-neo mt-2 w-44 z-50 font-mono text-[11px] font-bold uppercase"
              >
                {["retro", "cyberpunk", "valentine", "synthwave", "dark", "light"].map((t) => (
                  <li key={t}>
                    <button 
                      type="button" 
                      onClick={() => handleThemeChange(t)}
                      className={`px-3 py-1.5 hover:bg-base-200 text-left w-full rounded-none flex items-center justify-between ${t === theme ? "bg-primary text-primary-content hover:bg-primary" : ""}`}
                    >
                      <span>{t}</span>
                      {t === "retro" && <span className="text-[8px] opacity-75">(DEF)</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Logout Button */}
            <button
              className="btn btn-error btn-outline border-2 border-base-content font-mono text-xs uppercase shadow-neo-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo transition-all flex items-center gap-1.5 h-10 px-3"
              type="button"
              onClick={handleSignOut}
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Chat Container */}
      <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col p-4 md:py-6">
        <div className="flex flex-1 flex-col overflow-hidden border-4 border-base-content bg-base-100 shadow-neo">
          
          {/* Diagnostic Info Stripe */}
          <div className="bg-diagonal-hatch h-5 border-b-2 border-base-content flex items-center justify-between px-4 text-[9px] font-mono font-bold tracking-wider text-base-content/80 select-none">
            <span>SESSION_ADDR: {SOCKET_URL}</span>
            <span>REALTIME_COMMS: CONNECTED</span>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 bg-base-100">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center p-4">
                <div className="mb-4 border-2 border-base-content bg-base-200 p-4 shadow-neo-sm text-base-content">
                  <MessageSquare size={32} />
                </div>
                <h3 className="text-lg font-black font-mono uppercase">COMMS_LOG: EMPTY</h3>
                <p className="text-xs font-mono text-base-content/60 mt-1 uppercase">Be the first to transmit a message!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {messages.map((msg) => {
                  const isOwnMessage = msg.username === session.user.name;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"}`}
                    >
                      {/* Sender username */}
                      {!isOwnMessage && (
                        <span className="mb-1 ml-1 font-mono text-xs font-black uppercase text-secondary">
                          {msg.username}
                        </span>
                      )}
                      
                      {/* Message Bubble */}
                      <div
                        className={`max-w-[80%] px-4 py-3 font-mono text-xs shadow-neo-sm border-2 border-base-content break-words ${
                          isOwnMessage
                            ? "rounded-2xl rounded-tr-none bg-primary text-primary-content"
                            : "rounded-2xl rounded-tl-none bg-base-200 text-base-content"
                        }`}
                      >
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      </div>

                      {/* Timestamp */}
                      <span className="mt-1 px-1.5 font-mono text-[9px] font-bold text-base-content/50 uppercase">
                        [{formatTime(msg.timestamp)}]
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Quick Emoji Toolbar */}
          <div className="flex items-center gap-2 overflow-x-auto border-t-2 border-base-content bg-base-200 px-4 py-2 select-none">
            <span className="font-mono text-[10px] font-black text-base-content/70 uppercase tracking-wider shrink-0 border-r border-base-content/30 pr-2">
              QUICK_INPUT:
            </span>
            <div className="flex items-center gap-1.5">
              {quickEmojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleAddEmoji(emoji)}
                  className="rounded-md px-1.5 py-0.5 text-sm font-mono border border-transparent hover:border-base-content hover:bg-base-100 transition-all hover:scale-110 active:scale-90"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Message Input Form */}
          <form
            onSubmit={handleSendMessage}
            className="flex gap-2.5 border-t-4 border-base-content bg-base-100 p-4"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Transmit encrypted message..."
              className="flex-1 border-2 border-base-content bg-base-100 px-4 py-3 font-mono text-xs shadow-neo-sm focus:outline-none focus:translate-x-[-2px] focus:translate-y-[-2px] focus:shadow-neo transition-all placeholder:text-base-content/40"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="btn btn-primary border-2 border-base-content font-mono font-bold uppercase text-xs px-6 shadow-neo-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
            >
              <Send size={14} />
              <span className="hidden sm:inline ml-1.5">TRANSMIT</span>
            </button>
          </form>

        </div>
      </section>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-base-300/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-base-100 border-4 border-base-content shadow-neo overflow-hidden relative animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-diagonal-hatch h-6 border-b-4 border-base-content flex items-center justify-between px-4 text-[9px] font-mono font-bold tracking-wider text-base-content select-none">
              <span>SYSTEM: SETTINGS // PROFILE_CONFIG</span>
              <button 
                type="button" 
                onClick={() => setIsSettingsOpen(false)} 
                className="hover:text-error font-black font-sans px-1 cursor-pointer"
              >
                [X]
              </button>
            </div>

            <div className="p-6">
              <h2 className="text-xl font-black font-mono uppercase border-b-2 border-base-content pb-2 mb-4 select-none">
                [ Profile Settings ]
              </h2>

              <form onSubmit={handleSaveNickname} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="font-mono text-xs font-bold uppercase text-base-content/85 block select-none">
                    Player Nickname
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    disabled={session.user.isAnonymous}
                    placeholder="Enter nickname"
                    maxLength={25}
                    className="w-full border-2 border-base-content bg-base-100 px-4 py-2.5 font-mono text-sm shadow-neo-sm focus:outline-none focus:translate-x-[-2px] focus:translate-y-[-2px] focus:shadow-neo transition-all placeholder:text-base-content/40 disabled:opacity-55 disabled:cursor-not-allowed"
                  />
                  {session.user.isAnonymous && (
                    <p className="font-mono text-[10px] text-warning font-bold uppercase mt-1 leading-normal select-none">
                      * Guest accounts cannot customize nicknames. Log in with Google to set a custom name.
                    </p>
                  )}
                </div>

                {saveError && (
                  <div className="border-2 border-error bg-error/10 p-2 text-error font-mono text-[10px] font-bold uppercase shadow-neo-sm animate-pulse">
                    ERROR: {saveError}
                  </div>
                )}

                {saveSuccess && (
                  <div className="border-2 border-success bg-success/10 p-2 text-success font-mono text-[10px] font-bold uppercase shadow-neo-sm">
                    SUCCESS: PROFILE UPDATED
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(false)}
                    className="btn btn-outline border-2 border-base-content font-mono font-bold uppercase text-xs shadow-neo-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo active:translate-x-[2px] active:translate-y-[2px] active:shadow-none h-10 px-4 cursor-pointer"
                  >
                    CLOSE
                  </button>
                  {!session.user.isAnonymous && (
                    <button
                      type="submit"
                      disabled={saveLoading || !nickname.trim() || nickname.trim() === session.user.name}
                      className="btn btn-primary border-2 border-base-content font-mono font-bold uppercase text-xs shadow-neo-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo active:translate-x-[2px] active:translate-y-[2px] active:shadow-none h-10 px-4 disabled:opacity-50 cursor-pointer"
                    >
                      {saveLoading ? "SAVING..." : "SAVE CHANGES"}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
