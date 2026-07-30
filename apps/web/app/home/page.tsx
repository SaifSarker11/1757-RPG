"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { authClient } from "@/lib/auth-client";

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: string;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3001";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// 32 core DaisyUI themes
const THEMES = [
  "light", "dark", "cupcake", "bumblebee", "emerald", "corporate", "synthwave",
  "retro", "cyberpunk", "valentine", "halloween", "garden", "forest", "aqua",
  "lofi", "pastel", "fantasy", "wireframe", "black", "luxury", "dracula",
  "cmyk", "autumn", "business", "acid", "lemon", "night", "coffee", "winter",
  "dim", "nord", "sunset"
];

export default function HomePage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Theme selector state
  const [currentTheme, setCurrentTheme] = useState("retro");

  // Room creation and joining state
  const [joinCode, setJoinCode] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    // Load and set theme
    const savedTheme = localStorage.getItem("daisyui-theme") || "retro";
    setCurrentTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const changeTheme = (themeName: string) => {
    setCurrentTheme(themeName);
    localStorage.setItem("daisyui-theme", themeName);
    document.documentElement.setAttribute("data-theme", themeName);
  };

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/login");
    }
  }, [isPending, session, router]);

  useEffect(() => {
    if (!session) return;

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.emit("user:identify", { userId: session.user.id });

    socket.on("chat:history", (history: ChatMessage[]) => {
      setMessages(history);
    });

    socket.on("chat:message", (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.disconnect();
    };
  }, [session]);

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

    socketRef.current.emit("chat:send-message", {
      roomId: "lobby",
      userId: session.user.id,
      username: session.user.name,
      text: inputText,
    });
    setInputText("");
  };

  const handleCreateRoom = async () => {
    if (!session?.user) return;
    setError(null);
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostUserId: session.user.id,
          maxPlayers,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error ?? "Failed to create room");
      }

      const data = await res.json();
      router.push(`/room/${data.roomId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating room");
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinRoomByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const codeOrId = joinCode.trim();
    if (!codeOrId || !session?.user) return;
    setError(null);
    setActionLoading(true);
    try {
      let roomId = "";

      if (codeOrId.length === 6) {
        // Look up by room code
        const res = await fetch(`${API_URL}/rooms/code/${codeOrId.toUpperCase()}`);
        if (!res.ok) {
          throw new Error("Invalid room code or room not found");
        }
        const data = await res.json();
        roomId = data.roomId;
      } else {
        // Assume full room ID
        const res = await fetch(`${API_URL}/rooms/${codeOrId}`);
        if (!res.ok) {
          throw new Error("Invalid room ID or room not found");
        }
        const data = await res.json();
        roomId = data.id;
      }
      
      // Join the player to the room players list in database
      const joinRes = await fetch(`${API_URL}/rooms/${roomId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id }),
      });

      if (!joinRes.ok) {
        const joinErr = await joinRes.json();
        if (joinErr.error !== "User already in room") {
          throw new Error(joinErr.error ?? "Failed to join room");
        }
      }

      router.push(`/room/${roomId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error joining room");
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
      <main className="flex min-h-screen items-center justify-center bg-base-200">
        <div className="text-center font-sans">
          <span className="loading loading-spinner loading-lg text-primary mb-4"></span>
          <p className="text-lg font-bold">Unrolling old scrolls...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-base-200 text-base-content font-sans p-4 md:p-6 flex flex-col items-center">
      
      {/* Navbar Banner using DaisyUI */}
      <div className="navbar bg-base-100 border border-base-300 shadow-md rounded-box w-full max-w-5xl px-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1">
          <span className="font-serif text-2xl font-extrabold tracking-wide uppercase text-primary">Battle of Plassey 1757</span>
        </div>

        <div className="flex-none flex items-center gap-3">
          <span className="text-xs font-semibold uppercase text-neutral-content bg-neutral px-3 py-1.5 rounded-lg">
            User: {session.user.name}
          </span>

          {/* Theme Dropdown */}
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-outline btn-sm">
              Theme: {currentTheme}
            </div>
            <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-10 w-52 p-2 shadow-lg border border-base-300 max-h-60 overflow-y-auto">
              {THEMES.map((themeName) => (
                <li key={themeName}>
                  <button onClick={() => changeTheme(themeName)} className="capitalize">
                    {themeName}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={handleSignOut}
            className="btn btn-error btn-sm"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-stretch">
        
        {/* LEFT COLUMN: Controls Dashboard (7 Columns) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="card bg-base-100 border border-base-300 shadow-md p-6 flex flex-col gap-6 flex-1 justify-between">
            
            <div>
              <h2 className="card-title text-2xl font-serif font-extrabold uppercase tracking-wide border-b pb-2 mb-4 text-primary">Lobby Panel</h2>
              <p className="text-sm text-base-content/85 leading-relaxed">
                Welcome to the local Battle of Plassey game hub. From here, you can commission a new secret council room or enter an existing one using its unique 6-character registry code or full room ID.
              </p>
            </div>

            {error && (
              <div className="alert alert-error text-xs font-bold py-3 rounded-lg">
                <span>{error}</span>
              </div>
            )}

            {/* Action 1: Create a Room */}
            <div className="card bg-base-200 p-5 rounded-xl border border-base-300">
              <h3 className="text-lg font-bold text-secondary mb-2">Create Council Chamber</h3>
              <p className="text-xs text-base-content/75 mb-4">Initialize a new secure sandbox room. Choose the maximum capacity limit (6-15 players).</p>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                <div className="form-control flex-1">
                  <span className="label-text font-bold mb-1">Max Capacity</span>
                  <input
                    type="number"
                    min={6}
                    max={15}
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(parseInt(e.target.value, 10))}
                    className="input input-bordered w-full font-sans bg-base-100"
                  />
                </div>
                
                <button
                  onClick={handleCreateRoom}
                  disabled={actionLoading}
                  className="btn btn-primary"
                >
                  {actionLoading ? "Creating..." : "Create Room"}
                </button>
              </div>
            </div>

            {/* Action 2: Join by Room Code */}
            <form onSubmit={handleJoinRoomByCode} className="card bg-base-200 p-5 rounded-xl border border-base-300">
              <h3 className="text-lg font-bold text-secondary mb-2">Enter Existing Chamber</h3>
              <p className="text-xs text-base-content/75 mb-4">Input the 6-character uppercase registry code or paste the full room ID directly.</p>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                <div className="form-control flex-1">
                  <span className="label-text font-bold mb-1">Registry Code / ID</span>
                  <input
                    type="text"
                    placeholder="e.g. A1B2C3 or cms70..."
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    required
                    className="input input-bordered w-full font-sans bg-base-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading || !joinCode.trim()}
                  className="btn btn-accent"
                >
                  {actionLoading ? "Joining..." : "Join Room"}
                </button>
              </div>
            </form>

          </div>
        </div>

        {/* RIGHT COLUMN: Global Chat (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="card bg-base-100 border border-base-300 shadow-md p-4 flex flex-col h-[480px] lg:h-auto lg:flex-1 justify-between">
            <h3 className="text-lg font-serif font-bold text-primary border-b pb-2 mb-3">Lobby Chat Scroll</h3>
            
            {/* Scrollable messages area */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-2 mb-3">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center opacity-50">
                  <p className="text-xs font-sans">No messages scroll. Start typing to write to the grand council...</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.userId === session.user.id;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                      <span className="text-[10px] font-sans font-bold text-base-content/60 mb-0.5">{msg.username}</span>
                      <div className={`px-3 py-1.5 rounded-lg text-xs break-words max-w-[85%] ${
                        isOwn 
                          ? "bg-primary text-primary-content rounded-tr-none" 
                          : "bg-base-200 text-base-content rounded-tl-none border border-base-300"
                      }`}>
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-base-content/40 mt-0.5 px-0.5">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="flex gap-2 border-t pt-3 border-base-300">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Write scroll..."
                className="input input-bordered flex-1 text-xs font-sans bg-base-200"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="btn btn-primary text-xs"
              >
                Send
              </button>
            </form>
          </div>
        </div>

      </div>
    </main>
  );
}
