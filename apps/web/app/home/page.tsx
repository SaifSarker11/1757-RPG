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

  // Themes list
  const DAISYUI_THEMES = [
    "light", "dark", "cupcake", "bumblebee", "emerald", "corporate",
    "synthwave", "retro", "cyberpunk", "valentine", "halloween", "garden",
    "forest", "aqua", "lofi", "pastel", "fantasy", "wireframe",
    "black", "luxury", "dracula", "cmyk", "autumn", "business",
    "acid", "lemonade", "night", "coffee", "winter", "dim",
    "nord", "sunset", "caramellatte", "abyss", "silk"
  ];

  // Settings states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [nickname, setNickname] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Theme selector modal states
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [themeSearch, setThemeSearch] = useState("");

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
      <main className="flex min-h-screen items-center justify-center bg-base-300 text-base-content font-tech">
        <div className="flex flex-col items-center gap-3 p-8 border-2 border-base-content bg-base-100 shadow-neo relative">
          <div className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-2 border-l-2 border-primary"></div>
          <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-2 border-r-2 border-secondary"></div>
          <div className="h-10 w-10 animate-spin border-4 border-primary border-t-transparent"></div>
          <p className="text-sm font-bold uppercase tracking-wider">SECURE_PROFILE: LOADING...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-grid-pattern bg-base-200 text-base-content scanlines font-tech">
      {/* Header Bar */}
      <header className="sticky top-0 z-10 border-b-2 border-base-content bg-base-100">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <div className="flex flex-col select-none">
            <h1 className="text-2xl font-black tracking-tight uppercase flex items-center gap-1">
              <span>1757</span>
              <span className="text-primary animate-pulse">//</span>
              <span className="text-secondary">RPG</span>
            </h1>
            <p className="text-[10px] font-bold tracking-widest uppercase text-base-content/60">
              AGENT_ID: <span className="text-primary">{session.user.name}</span>
            </p>
          </div>
          
          {/* Header Controls */}
          <div className="flex items-center gap-3">
            {/* Profile Settings Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="btn btn-outline border-2 border-base-content text-xs uppercase shadow-neo-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo transition-all flex items-center gap-1.5 h-10 px-3 cursor-pointer"
              type="button"
            >
              <Settings size={14} className="animate-[spin_12s_linear_infinite]" />
              <span className="hidden sm:inline">Settings</span>
            </button>

            {/* Theme Selector Trigger Button */}
            <button
              onClick={() => setIsThemeModalOpen(true)}
              className="btn btn-outline border-2 border-base-content text-xs uppercase shadow-neo-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo transition-all flex items-center gap-1.5 h-10 px-3 cursor-pointer"
              type="button"
            >
              <span className="hidden sm:inline">Theme:</span>
              <span className="text-primary font-black">{theme}</span>
              <ChevronDown size={12} className="opacity-60" />
            </button>

            {/* Logout Button */}
            <button
              className="btn btn-error btn-outline border-2 border-base-content text-xs uppercase shadow-neo-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo transition-all flex items-center gap-1.5 h-10 px-3"
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
          <div className="w-full max-w-md bg-base-100 border-2 border-base-content relative animate-in fade-in zoom-in-95 duration-150 shadow-neo">
            {/* Corner Angle Brackets on Settings Modal */}
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-primary"></div>
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-primary"></div>
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-secondary"></div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-secondary"></div>

            {/* Modal Header */}
            <div className="bg-diagonal-hatch h-8 border-b-2 border-base-content flex items-center justify-between px-4 text-xs font-bold tracking-wider text-base-content select-none">
              <span>SYSTEM: SETTINGS // PROFILE_CONFIG</span>
              <button 
                type="button" 
                onClick={() => setIsSettingsOpen(false)} 
                className="hover:text-error font-black px-1 cursor-pointer font-sans"
              >
                [X]
              </button>
            </div>

            <div className="p-6">
              <h2 className="text-lg font-black uppercase border-b-2 border-base-content pb-2 mb-4 select-none">
                [ Profile Settings ]
              </h2>

              <form onSubmit={handleSaveNickname} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-base-content/85 block select-none">
                    Player Nickname
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    disabled={session.user.isAnonymous}
                    placeholder="Enter nickname"
                    maxLength={25}
                    className="w-full border-2 border-base-content bg-base-100 px-4 py-2.5 text-xs shadow-neo-sm focus:outline-none focus:translate-x-[-2px] focus:translate-y-[-2px] focus:shadow-neo transition-all placeholder:text-base-content/40 disabled:opacity-55 disabled:cursor-not-allowed"
                  />
                  {session.user.isAnonymous && (
                    <p className="text-[10px] text-warning font-bold uppercase mt-1 leading-normal select-none">
                      * Guest accounts cannot customize nicknames. Log in with Google to set a custom name.
                    </p>
                  )}
                </div>

                {saveError && (
                  <div className="border border-error bg-error/10 p-2 text-error text-[10px] font-bold uppercase shadow-neo-sm animate-pulse">
                    ERROR: {saveError}
                  </div>
                )}

                {saveSuccess && (
                  <div className="border border-success bg-success/10 p-2 text-success text-[10px] font-bold uppercase shadow-neo-sm">
                    SUCCESS: PROFILE UPDATED
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(false)}
                    className="btn btn-outline border-2 border-base-content font-bold uppercase text-xs shadow-neo-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo active:translate-x-[2px] active:translate-y-[2px] active:shadow-none h-10 px-4 cursor-pointer"
                  >
                    CLOSE
                  </button>
                  {!session.user.isAnonymous && (
                    <button
                      type="submit"
                      disabled={saveLoading || !nickname.trim() || nickname.trim() === session.user.name}
                      className="btn btn-primary border-2 border-base-content font-bold uppercase text-xs shadow-neo-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo active:translate-x-[2px] active:translate-y-[2px] active:shadow-none h-10 px-4 disabled:opacity-50 cursor-pointer"
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

      {/* Theme Settings Modal */}
      {isThemeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-base-300/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl bg-base-100 border-2 border-base-content relative animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[80vh] shadow-neo">
            {/* Corner Angle Brackets on Theme Modal */}
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-primary"></div>
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-primary"></div>
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-secondary"></div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-secondary"></div>

            {/* Modal Header */}
            <div className="bg-diagonal-hatch h-8 shrink-0 border-b-2 border-base-content flex items-center justify-between px-4 text-xs font-bold tracking-wider text-base-content select-none">
              <span>SYSTEM: THEME_CONFIG // 35_BUILTIN_THEMES</span>
              <button 
                type="button" 
                onClick={() => setIsThemeModalOpen(false)} 
                className="hover:text-error font-black px-1 cursor-pointer font-sans"
              >
                [X]
              </button>
            </div>

            <div className="p-6 flex flex-col flex-1 overflow-hidden">
              <h2 className="text-lg font-black uppercase border-b-2 border-base-content pb-2 mb-4 select-none flex justify-between items-center">
                <span>[ Select Interface Theme ]</span>
                <span className="text-xs text-base-content/60 font-bold uppercase font-mono">ACTIVE: {theme}</span>
              </h2>

              {/* Search input bar */}
              <div className="mb-4 shrink-0">
                <input
                  type="text"
                  placeholder="Search 35 themes... (e.g. synthwave, cyber, dark)"
                  value={themeSearch}
                  onChange={(e) => setThemeSearch(e.target.value)}
                  className="w-full border-2 border-base-content bg-base-100 px-4 py-2 text-xs shadow-neo-sm focus:outline-none focus:translate-x-[-2px] focus:translate-y-[-2px] focus:shadow-neo transition-all placeholder:text-base-content/40"
                />
              </div>

              {/* Scrollable themes grid */}
              <div className="flex-1 overflow-y-auto pr-2 min-h-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {DAISYUI_THEMES.filter(t => t.toLowerCase().includes(themeSearch.toLowerCase())).map((t) => (
                    <button
                      key={t}
                      type="button"
                      data-theme={t}
                      onClick={() => {
                        handleThemeChange(t);
                        setIsThemeModalOpen(false);
                      }}
                      className={`btn btn-outline bg-base-100 text-base-content border-2 font-mono text-[11px] p-3 h-auto rounded-none flex flex-col items-stretch gap-2 transition-all cursor-pointer text-left hover:scale-[1.02] active:scale-95 ${
                        t === theme
                          ? "border-primary outline-2 outline-primary"
                          : "border-base-content"
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="font-black uppercase">{t}</span>
                        {t === theme && (
                          <span className="text-[8px] bg-primary text-primary-content px-1 font-bold">ACTIVE</span>
                        )}
                      </div>
                      
                      {/* Theme color preview chips using standard daisyUI variable references scoped to data-theme */}
                      <div className="flex gap-1.5 justify-start mt-0.5 pointer-events-none">
                        <div className="w-3.5 h-3.5 rounded-full bg-primary border border-base-content/10" title="Primary"></div>
                        <div className="w-3.5 h-3.5 rounded-full bg-secondary border border-base-content/10" title="Secondary"></div>
                        <div className="w-3.5 h-3.5 rounded-full bg-accent border border-base-content/10" title="Accent"></div>
                        <div className="w-3.5 h-3.5 rounded-full bg-neutral border border-base-content/10" title="Neutral"></div>
                        <div className="w-3.5 h-3.5 rounded-full bg-base-100 border border-base-content/10" title="Base"></div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4 shrink-0 border-t-2 border-base-content mt-4">
                <button
                  type="button"
                  onClick={() => setIsThemeModalOpen(false)}
                  className="btn btn-outline border-2 border-base-content font-bold uppercase text-xs shadow-neo-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo active:translate-x-[2px] active:translate-y-[2px] active:shadow-none h-10 px-4 cursor-pointer"
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
