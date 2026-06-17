"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { authClient } from "@/lib/auth-client";
import { Settings, LogOut, ChevronDown, Send, MessageSquare, Plus, Shuffle, LogIn, Users, AlertTriangle } from "lucide-react";

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
  const [theme, setTheme] = useState<string>("lemonade");
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Room & Online states
  const [onlineUsers, setOnlineUsers] = useState<{ userId: string; username: string; roomId: string | null }[]>([]);
  const [roomInvite, setRoomInvite] = useState<{ roomId: string; roomCode: string; hostName: string } | null>(null);
  const [maxPlayers, setMaxPlayers] = useState<number>(10);
  const [roomCodeInput, setRoomCodeInput] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    const savedTheme = localStorage.getItem("theme") || "lemonade";
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

    // Identify user
    socket.emit("user:identify", { userId: session.user.id, username: session.user.name });

    // Listen for past message history
    socket.on("chat:history", (history: ChatMessage[]) => {
      setMessages(history);
    });

    // Listen for new incoming messages
    socket.on("chat:message", (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
    });

    // Listen for online users update
    socket.on("online-users:update", (users: any[]) => {
      setOnlineUsers(users);
    });

    // Listen for room invitation
    socket.on("room:invited", (invite: any) => {
      setRoomInvite(invite);
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

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;
    setActionLoading(true);
    setErrorMessage(null);

    try {
      const createRes = await fetch("/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostUserId: session.user.id, maxPlayers }),
      });

      const createData = await createRes.json();
      if (!createRes.ok || !createData.roomId) {
        throw new Error(createData.error || "Failed to create room");
      }

      router.push(`/room/${createData.roomId}`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinRandom = async () => {
    if (!session?.user?.id) return;
    setActionLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/rooms/join-random", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id }),
      });

      const data = await res.json();
      if (!res.ok || !data.roomId) {
        throw new Error(data.error || "Failed to join random room");
      }

      router.push(`/room/${data.roomId}`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCodeInput.trim() || !session?.user?.id) return;
    setActionLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/rooms/${roomCodeInput.trim()}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id }),
      });

      const data = await res.json();
      if (!res.ok || !data.roomId) {
        throw new Error(data.error || "Failed to join room");
      }

      router.push(`/room/${data.roomId}`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Room not found or game already in progress");
    } finally {
      setActionLoading(false);
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

      {/* Main Console Layout */}
      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 md:py-6 lg:flex-row">
        {/* Left Column: Lobby Gateway */}
        <div className="flex flex-1 flex-col gap-6 lg:max-w-md">
          {/* Create / Join Console */}
          <div className="flex flex-col border-4 border-base-content bg-base-100 shadow-neo relative">
            <div className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-2 border-l-2 border-primary"></div>
            <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-2 border-r-2 border-secondary"></div>
            
            <div className="bg-diagonal-hatch h-6 border-b-2 border-base-content flex items-center justify-between px-3 text-[10px] font-mono font-bold tracking-wider text-base-content/85 select-none">
              <span>CONSOLE: LOBBY_GATEWAY</span>
              <span>SYS_ACTIVE</span>
            </div>

            <div className="p-5 space-y-6">
              {errorMessage && (
                <div className="border border-error bg-error/10 p-2 text-error text-[10px] font-bold uppercase shadow-neo-sm animate-pulse flex items-center gap-1.5">
                  <AlertTriangle size={12} />
                  <span>ERROR: {errorMessage}</span>
                </div>
              )}

              {/* Join Random Room */}
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase text-base-content/90 font-mono tracking-wider flex items-center gap-1.5">
                  <Shuffle size={14} className="text-primary animate-pulse" />
                  <span>[ Random Ingress ]</span>
                </h3>
                <p className="text-[10px] text-base-content/60 font-mono">
                  Enter the first queue waiting for agents, or deploy a new node if none exist.
                </p>
                <button
                  onClick={handleJoinRandom}
                  disabled={actionLoading}
                  className="btn btn-primary w-full border-2 border-base-content font-mono font-bold uppercase text-xs shadow-neo-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 h-11"
                >
                  {actionLoading ? "CONNECTING..." : "JOIN RANDOM ROOM"}
                </button>
              </div>

              <div className="border-t-2 border-dashed border-base-content/20 my-4"></div>

              {/* Join by Code */}
              <form onSubmit={handleJoinByCode} className="space-y-3">
                <h3 className="text-xs font-black uppercase text-base-content/90 font-mono tracking-wider flex items-center gap-1.5">
                  <LogIn size={14} className="text-secondary" />
                  <span>[ Join by Node ID/Code ]</span>
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter 6-char Room Code or ID"
                    value={roomCodeInput}
                    onChange={(e) => setRoomCodeInput(e.target.value)}
                    maxLength={32}
                    className="flex-1 border-2 border-base-content bg-base-100 px-3 py-2 font-mono text-xs shadow-neo-sm focus:outline-none focus:translate-x-[-2px] focus:translate-y-[-2px] focus:shadow-neo transition-all placeholder:text-base-content/30"
                  />
                  <button
                    type="submit"
                    disabled={actionLoading || !roomCodeInput.trim()}
                    className="btn btn-secondary border-2 border-base-content font-mono font-bold uppercase text-xs px-4 shadow-neo-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo transition-all disabled:opacity-50"
                  >
                    CONNECT
                  </button>
                </div>
              </form>

              <div className="border-t-2 border-dashed border-base-content/20 my-4"></div>

              {/* Create Custom Room */}
              <form onSubmit={handleCreateRoom} className="space-y-3">
                <h3 className="text-xs font-black uppercase text-base-content/90 font-mono tracking-wider flex items-center gap-1.5">
                  <Plus size={14} className="text-accent" />
                  <span>[ Deploy Custom Node ]</span>
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-mono text-base-content/80">
                    <span>MAX PLAYER SLOTS:</span>
                    <span className="font-bold text-accent">{maxPlayers} PLYRS</span>
                  </div>
                  <input
                    type="range"
                    min="6"
                    max="15"
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                    className="range range-accent range-xs border border-base-content"
                  />
                  <div className="flex justify-between text-[8px] font-mono opacity-50 px-1">
                    <span>MIN: 6</span>
                    <span>MID: 10</span>
                    <span>MAX: 15</span>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn btn-accent w-full border-2 border-base-content font-mono font-bold uppercase text-xs shadow-neo-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 h-11 text-accent-content"
                >
                  {actionLoading ? "PROVISIONING..." : "CREATE CUSTOM LOBBY"}
                </button>
              </form>
            </div>
          </div>

          {/* Incoming Invitations Alerts */}
          {roomInvite && (
            <div className="flex flex-col border-4 border-primary bg-base-100 shadow-neo relative">
              <div className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-2 border-l-2 border-primary"></div>
              <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-2 border-r-2 border-primary"></div>
              <div className="bg-primary px-3 py-1 text-[9px] font-mono font-bold text-primary-content uppercase tracking-wider">
                ⚡ INCOMING ROOM INVITATION
              </div>
              <div className="p-4 space-y-4 font-mono text-xs">
                <p>
                  Host <span className="font-bold text-primary">{roomInvite.hostName}</span> invites you to join Room <span className="font-bold text-secondary uppercase bg-base-200 px-1.5 py-0.5 border border-base-content/20">{roomInvite.roomCode}</span>.
                </p>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setRoomInvite(null)}
                    className="btn btn-outline border-2 border-base-content btn-xs font-bold font-mono h-8 px-3"
                  >
                    DECLINE
                  </button>
                  <button
                    onClick={async () => {
                      setActionLoading(true);
                      setErrorMessage(null);
                      try {
                        const res = await fetch(`/rooms/${roomInvite.roomId}/join`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ userId: session.user.id }),
                        });
                        const data = await res.json();
                        if (!res.ok || !data.roomId) {
                          throw new Error(data.error || "Failed to join room");
                        }
                        router.push(`/room/${data.roomId}`);
                      } catch (err) {
                        setErrorMessage(err instanceof Error ? err.message : "Error joining room");
                      } finally {
                        setActionLoading(false);
                        setRoomInvite(null);
                      }
                    }}
                    className="btn btn-primary border-2 border-base-content btn-xs font-bold font-mono h-8 px-3"
                  >
                    ACCEPT
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Comms Console & Users */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Online Users Module */}
          <div className="flex flex-col border-4 border-base-content bg-base-100 shadow-neo relative max-h-[160px]">
            <div className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-2 border-l-2 border-secondary"></div>
            
            <div className="bg-diagonal-hatch h-6 shrink-0 border-b-2 border-base-content flex items-center justify-between px-3 text-[10px] font-mono font-bold tracking-wider text-base-content/85 select-none">
              <span className="flex items-center gap-1.5">
                <Users size={12} className="text-secondary" />
                <span>ONLINE_RADAR: ACTIVE_USERS ({onlineUsers.length})</span>
              </span>
              <span>RADAR</span>
            </div>

            <div className="p-3 overflow-y-auto flex-1 bg-base-100">
              {onlineUsers.length <= 1 ? (
                <p className="text-[10px] font-mono text-base-content/50 uppercase italic text-center p-3">No other agents online.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {onlineUsers.map(user => {
                    const isSelf = user.userId === session.user.id;
                    if (isSelf) return null;
                    return (
                      <div
                        key={user.userId}
                        className="flex items-center gap-1.5 px-2.5 py-1 border border-base-content bg-base-200 text-[10px] font-mono shadow-neo-sm"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${user.roomId ? 'bg-secondary animate-pulse' : 'bg-success'}`}></span>
                        <span className="font-bold text-base-content">{user.username}</span>
                        <span className="opacity-50 text-[8px]">
                          [{user.roomId ? "IN_ROOM" : "IDLE"}]
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Global Chat logs */}
          <div className="flex-1 flex flex-col overflow-hidden border-4 border-base-content bg-base-100 shadow-neo relative min-h-[300px]">
            {/* Corner Angle Brackets */}
            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 border-t-2 border-r-2 border-primary"></div>
            <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 border-b-2 border-l-2 border-secondary"></div>

            <div className="bg-diagonal-hatch h-6 shrink-0 border-b-2 border-base-content flex items-center justify-between px-4 text-[9px] font-mono font-bold tracking-wider text-base-content/80 select-none">
              <span>SESSION_ADDR: {SOCKET_URL}</span>
              <span>GLOBAL_COMMS: CONNECTED</span>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-base-100">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center p-4">
                  <div className="mb-3 border-2 border-base-content bg-base-200 p-3 shadow-neo-sm text-base-content">
                    <MessageSquare size={24} />
                  </div>
                  <h3 className="text-xs font-black font-mono uppercase">COMMS_LOG: EMPTY</h3>
                  <p className="text-[9px] font-mono text-base-content/50 mt-1 uppercase">Be the first to transmit a message!</p>
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
                        {!isOwnMessage && (
                          <span className="mb-0.5 ml-1 font-mono text-[9px] font-black uppercase text-secondary">
                            {msg.username}
                          </span>
                        )}
                        
                        <div
                          className={`max-w-[85%] px-3 py-2 font-mono text-[11px] shadow-neo-sm border-2 border-base-content break-words ${
                            isOwnMessage
                              ? "rounded-xl rounded-tr-none bg-primary text-primary-content"
                              : "rounded-xl rounded-tl-none bg-base-200 text-base-content"
                          }`}
                        >
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        </div>

                        <span className="mt-0.5 px-1 font-mono text-[8px] font-bold text-base-content/50 uppercase">
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
            <div className="flex items-center gap-1.5 overflow-x-auto border-t-2 border-base-content bg-base-200 px-3 py-1.5 select-none shrink-0">
              <span className="font-mono text-[9px] font-black text-base-content/70 uppercase tracking-wider shrink-0 border-r border-base-content/30 pr-2">
                QUICK_INPUT:
              </span>
              <div className="flex items-center gap-1">
                {quickEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleAddEmoji(emoji)}
                    className="rounded-md px-1.5 py-0.5 text-xs font-mono border border-transparent hover:border-base-content hover:bg-base-100 transition-all hover:scale-110 active:scale-90"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Input Form */}
            <form
              onSubmit={handleSendMessage}
              className="flex gap-2 border-t-2 border-base-content bg-base-100 p-3 shrink-0"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Transmit global broadcast..."
                className="flex-1 border-2 border-base-content bg-base-100 px-3 py-2 font-mono text-xs shadow-neo-sm focus:outline-none focus:translate-x-[-2px] focus:translate-y-[-2px] focus:shadow-neo transition-all placeholder:text-base-content/30"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="btn btn-primary border-2 border-base-content font-mono font-bold uppercase text-xs px-4 shadow-neo-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo transition-all"
              >
                <Send size={12} />
                <span className="hidden sm:inline ml-1 font-mono text-[10px]">SEND</span>
              </button>
            </form>
          </div>
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
