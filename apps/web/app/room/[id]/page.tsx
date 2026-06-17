"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { authClient } from "@/lib/auth-client";
import { Settings, LogOut, ChevronDown, Send, MessageSquare, Copy, Shield, Crown, UserMinus, UserPlus, Users, AlertTriangle, Play, Check, X, Eye } from "lucide-react";

interface Player {
  userId: string;
  username: string;
  team: string | null;
  isSelector: boolean;
}

interface ChatMessage {
  id: string;
  username: string;
  text: string;
  timestamp: string;
}

interface PrivateRoleInfo {
  role: string;
  team: string;
  visiblePlayers: Array<{ userId: string; role: string; team: string }>;
  isFlustered: boolean;
}

interface GameState {
  roundNumber: number;
  phase: string;
  selectorId: string | null;
  rejectionCount: number;
  selectedTeam: string[];
  teamVotes: Record<string, string> | null;
  missionVotes: Record<string, string> | null;
  greenWins: number;
  redWins: number;
  winner?: string;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3001";

// Description helpers for historical roles
const ROLE_DESCRIPTIONS: Record<string, { name: string; desc: string; goals: string }> = {
  nawab_siraj: {
    name: "Nawab Siraj-ud-Daulah",
    desc: "The rightful ruler of Bengal. You must protect your sovereignty.",
    goals: "Goals: Find and trust your loyal allies (Green Team). Avoid Jafars and British spies.",
  },
  lutfunnesa: {
    name: "Begum Lutfunnesa",
    desc: "Nawab's loyal wife and advisor. You know who the Nawab is.",
    goals: "Goals: Guide the Nawab and protect him from the conspirators.",
  },
  mir_madan: {
    name: "Mir Madan",
    desc: "The fierce and loyal general of Nawab's artillery.",
    goals: "Goals: Successfully complete the missions to defend the Nawabi.",
  },
  mohon_lal: {
    name: "Mohan Lal",
    desc: "Nawab's trusted Prime Minister, loyal to the very end.",
    goals: "Goals: Detect betrayal and ensure the Nawab's victory.",
  },
  mir_jafar: {
    name: "Mir Jafar",
    desc: "The traitor. Commander-in-chief planning a coup with the British.",
    goals: "Goals: Sabotage Nawab's plans. Ensure the British/Red Team wins 3 rounds.",
  },
  ghasheti_begum: {
    name: "Ghaseti Begum",
    desc: "Nawab's bitter aunt, conspiring to overthrow him.",
    goals: "Goals: Secretly work with Mir Jafar and the British to fail missions.",
  },
  jagat_seth: {
    name: "Jagat Seth",
    desc: "The wealthy banker financing the conspiracy.",
    goals: "Goals: Buy influence, fail missions. Can identify Nawab at the end.",
  },
  saint_frasy: {
    name: "Monsieur St. Frais",
    desc: "Nawab's French ally commandering the artillery.",
    goals: "Goals: Cooperate with green team members to pass missions.",
  },
  de_bussy: {
    name: "Marquis de Bussy",
    desc: "French General. Has the power to verify one player's alignment.",
    goals: "Goals: Use your radar to verify and expose the Jafars.",
  },
  jean_law: {
    name: "Jean Law",
    desc: "French diplomat. Can lock down one suspect player from voting.",
    goals: "Goals: Silence Jafars and red team saboteurs.",
  },
  umichad: {
    name: "Amir Chand (Umichand)",
    desc: "Double-dealing merchant assisting the British.",
    goals: "Goals: Conspire with red team, hide your true intent.",
  },
  yar_lutuf: {
    name: "Yar Lutuf Khan",
    desc: "Military commander secretly aligned with Jafar.",
    goals: "Goals: Pretend to be loyal to Siraj, then strike when needed.",
  },
  tara_bai: {
    name: "Tara Bai",
    desc: "Royal family member creating discord. Flusters the Nawab.",
    goals: "Goals: Sow chaos, confuse Nawab's allies.",
  },
};

const ROUND_TEAM_SIZES: Record<number, number> = {
  1: 2,
  2: 3,
  3: 4,
  4: 5,
  5: 4,
};

export default function RoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.id as string;

  const { data: session, isPending } = authClient.useSession();
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // States
  const [room, setRoom] = useState<{
    id: string;
    code: string;
    hostUserId: string;
    status: string;
    maxPlayers: number;
    players: Player[];
    greenWins: number;
    redWins: number;
  } | null>(null);

  const [onlineUsers, setOnlineUsers] = useState<{ userId: string; username: string; roomId: string | null }[]>([]);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Game States
  const [assignedRole, setAssignedRole] = useState<PrivateRoleInfo | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedTeamProposal, setSelectedTeamProposal] = useState<string[]>([]);
  const [hasVotedTeam, setHasVotedTeam] = useState(false);
  const [hasVotedMission, setHasVotedMission] = useState(false);

  // UI Theme State
  const [theme, setTheme] = useState("lemonade");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "lemonade";
    setTheme(savedTheme);
  }, []);

  // Fetch initial room details
  const fetchRoomDetails = async () => {
    try {
      const res = await fetch(`/rooms/${roomId}`);
      if (!res.ok) {
        throw new Error("Room not found or unauthorized");
      }
      const data = await res.json();
      setRoom(data);
      if (data.status === "IN_PROGRESS" && !gameState) {
        setGameState({
          roundNumber: data.currentRound || 1,
          phase: "DISCUSSION",
          selectorId: data.hostUserId,
          rejectionCount: 0,
          selectedTeam: [],
          teamVotes: null,
          missionVotes: null,
          greenWins: data.greenWins,
          redWins: data.redWins,
        });
      }
    } catch (err) {
      router.replace("/home");
    }
  };

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/login");
    } else if (session) {
      fetchRoomDetails();
    }
  }, [isPending, session, roomId]);

  // Handle socket connections
  useEffect(() => {
    if (!session || !roomId) return;

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    // Identify user
    socket.emit("user:identify", { userId: session.user.id, username: session.user.name });

    // Join room
    socket.emit("room:join", { roomId, userId: session.user.id });

    // Listeners
    socket.on("game:join", () => {
      fetchRoomDetails();
    });

    socket.on("game:leave", () => {
      fetchRoomDetails();
    });

    socket.on("room:host-changed", (data: { hostUserId: string }) => {
      setRoom((prev) => prev ? { ...prev, hostUserId: data.hostUserId } : null);
      setInfoMessage("Lobby host permissions transferred.");
      setTimeout(() => setInfoMessage(null), 4000);
    });

    socket.on("room:kicked", (data: { userId: string }) => {
      if (data.userId === session.user.id) {
        socket.disconnect();
        router.replace("/home?kicked=true");
      } else {
        fetchRoomDetails();
      }
    });

    socket.on("room:message", (message: ChatMessage) => {
      setChatMessages((prev) => [...prev, message]);
    });

    socket.on("online-users:update", (users: any[]) => {
      setOnlineUsers(users);
    });

    // Game listeners
    socket.on("role:assigned", (roleInfo: PrivateRoleInfo) => {
      setAssignedRole(roleInfo);
    });

    socket.on("game:started", () => {
      setInfoMessage("GAME COMMENCING. ROLES SECURED.");
      setTimeout(() => setInfoMessage(null), 5000);
      fetchRoomDetails();
    });

    socket.on("round:phase", (phaseData: GameState) => {
      setGameState(phaseData);
      setHasVotedTeam(false);
      setHasVotedMission(false);
      setSelectedTeamProposal([]);
      fetchRoomDetails();
    });

    socket.on("round:teamProposed", (data: { playerIds: string[] }) => {
      setGameState((prev) => prev ? { ...prev, selectedTeam: data.playerIds, phase: "TEAM_APPROVAL" } : null);
    });

    socket.on("round:approvalResult", (data: { approved: boolean }) => {
      setInfoMessage(data.approved ? "TEAM APPROVED. DEPLOYING TO MISSION." : "TEAM REJECTED. NEXT SELECTOR ASSIGNED.");
      setTimeout(() => setInfoMessage(null), 5000);
    });

    socket.on("game:end", (data: { winner: string; reason?: string }) => {
      setGameState((prev) => prev ? { ...prev, phase: "FINISHED", winner: data.winner } : null);
    });

    socket.on("room:error", (err: { message: string }) => {
      setErrorMessage(err.message);
      setTimeout(() => setErrorMessage(null), 6000);
    });

    return () => {
      socket.disconnect();
    };
  }, [session, roomId]);

  // Scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleCopyCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeaveRoom = async () => {
    if (!session?.user?.id || !room) return;
    setActionLoading(true);

    try {
      await fetch(`/rooms/${room.id}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id }),
      });
      if (socketRef.current) {
        socketRef.current.emit("room:leave", { roomId: room.id, userId: session.user.id });
      }
      router.replace("/home");
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleKickPlayer = async (targetUserId: string) => {
    if (!session?.user?.id || !room) return;
    try {
      await fetch(`/rooms/${room.id}/kick`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id, targetUserId }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handlePromotePlayer = async (targetUserId: string) => {
    if (!session?.user?.id || !room) return;
    try {
      await fetch(`/rooms/${room.id}/promote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id, targetUserId }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleFillBots = async () => {
    if (!room) return;
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/rooms/${room.id}/dev/fill-bots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fill bots");
      }
      await fetchRoomDetails();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Error filling bots");
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendRoomMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !socketRef.current || !session?.user || !room) return;

    socketRef.current.emit("room:send-message", {
      roomId: room.id,
      username: session.user.name,
      text: chatInput,
    });
    setChatInput("");
  };

  const handleStartGame = () => {
    if (!socketRef.current || !session || !room) return;
    socketRef.current.emit("game:start", { roomId: room.id, hostUserId: session.user.id });
  };

  // Game actions
  const toggleTeamSelection = (userId: string) => {
    setSelectedTeamProposal((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const submitTeamProposal = () => {
    if (!room || !socketRef.current) return;
    const requiredSize = ROUND_TEAM_SIZES[gameState?.roundNumber ?? 1] ?? 2;
    if (selectedTeamProposal.length !== requiredSize) {
      setErrorMessage(`Error: You must select exactly ${requiredSize} players.`);
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }
    socketRef.current.emit("round:proposeTeam", {
      roomId: room.id,
      selectorId: session?.user?.id,
      playerIds: selectedTeamProposal,
    });
  };

  const handleVoteTeam = (vote: "approve" | "reject") => {
    if (!room || !socketRef.current || !session) return;
    socketRef.current.emit("round:approvalVote", {
      roomId: room.id,
      userId: session.user.id,
      vote,
    });
    setHasVotedTeam(true);
  };

  const handleVoteMission = (vote: "green" | "red") => {
    if (!room || !socketRef.current || !session) return;
    socketRef.current.emit("round:missionVote", {
      roomId: room.id,
      userId: session.user.id,
      vote,
    });
    setHasVotedMission(true);
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

  if (isPending || !session || !room) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-base-300 text-base-content font-tech">
        <div className="flex flex-col items-center gap-3 p-8 border-2 border-base-content bg-base-100 shadow-neo relative">
          <div className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-2 border-l-2 border-primary"></div>
          <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-2 border-r-2 border-secondary"></div>
          <div className="h-10 w-10 animate-spin border-4 border-primary border-t-transparent"></div>
          <p className="text-sm font-bold uppercase tracking-wider">LOBBY_NODE: INITIALIZING...</p>
        </div>
      </main>
    );
  }

  const isHost = room.hostUserId === session.user.id;
  const isGameMode = room.status === "IN_PROGRESS" || (gameState && gameState.phase !== "DISCUSSION" && room.status !== "WAITING");

  // Required team size
  const expectedTeamSize = ROUND_TEAM_SIZES[gameState?.roundNumber ?? 1] ?? 2;

  return (
    <main className="flex min-h-screen flex-col bg-grid-pattern bg-base-200 text-base-content scanlines font-tech" data-theme={theme}>
      {/* Header bar */}
      <header className="sticky top-0 z-10 border-b-2 border-base-content bg-base-100 shrink-0">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLeaveRoom}
              className="btn btn-outline border-2 border-base-content text-[10px] uppercase shadow-neo-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo transition-all"
            >
              ← LEAVE
            </button>
            <div className="flex flex-col select-none">
              <h1 className="text-lg font-black tracking-tight uppercase flex items-center gap-1 leading-none">
                <span>1757_RPG</span>
                <span className="text-primary animate-pulse">//</span>
                <span className="text-secondary">LOBBY</span>
              </h1>
              <p className="text-[9px] font-bold tracking-widest uppercase text-base-content/60 mt-0.5">
                NODE_ADDR: <span className="text-primary">{room.code}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase border-2 border-base-content bg-base-200 px-2 py-1 shadow-neo-sm">
              ROLE: {isHost ? <span className="text-primary">HOST/ADMIN</span> : <span className="text-secondary">AGENT</span>}
            </span>
          </div>
        </div>
      </header>

      {/* Info messages */}
      {infoMessage && (
        <div className="bg-primary text-primary-content text-[11px] font-bold uppercase tracking-wider text-center py-1.5 border-b-2 border-base-content select-none">
          ⚡ SYSTEM_ALERT: {infoMessage}
        </div>
      )}

      {errorMessage && (
        <div className="bg-error text-error-content text-[11px] font-bold uppercase tracking-wider text-center py-1.5 border-b-2 border-base-content select-none animate-pulse">
          ⚠️ ERROR: {errorMessage}
        </div>
      )}

      {/* Main double column console */}
      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 md:py-6 lg:flex-row overflow-hidden">
        
        {/* Left Column: Lobby or Active Game Screen */}
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto">
          {!isGameMode ? (
            /* =================================================== */
            /* LOBBY VIEW (WAITING)                                */
            /* =================================================== */
            <div className="flex flex-col border-4 border-base-content bg-base-100 shadow-neo relative p-6 space-y-6">
              <div className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-2 border-l-2 border-primary"></div>
              <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-2 border-r-2 border-secondary"></div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-base-content pb-4">
                <div>
                  <h2 className="text-xl font-black uppercase">[ Secure Room Terminal ]</h2>
                  <p className="text-xs text-base-content/60 font-mono mt-1">Lobby is currently waiting for agents to establish links.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono border-2 border-base-content px-3 py-1 bg-base-200 uppercase font-black tracking-widest text-secondary">
                    {room.code}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="btn btn-square border-2 border-base-content btn-sm shadow-neo-sm hover:translate-y-[-1px] hover:shadow-neo"
                  >
                    {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* Player Count Alert */}
              <div className="flex items-center justify-between border-2 border-base-content bg-base-200 p-3 shadow-neo-sm">
                <span className="text-xs font-mono font-bold uppercase">LINKED_AGENTS_COUNT:</span>
                <span className="font-mono font-black text-xs px-2 py-0.5 border border-base-content bg-base-100 rounded-md">
                  {room.players.length} / {room.maxPlayers}
                </span>
              </div>

              {/* Lobby Players List */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase text-base-content/85 tracking-widest font-mono">
                  Linked Agent Network
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {room.players.map((plyr) => {
                    const isPlyrHost = plyr.userId === room.hostUserId;
                    const isSelf = plyr.userId === session.user.id;
                    const isBot = plyr.userId.startsWith("bot-");

                    return (
                      <div
                        key={plyr.userId}
                        className={`flex items-center justify-between p-3 border-2 border-base-content bg-base-100 shadow-neo-sm ${
                          isSelf ? "border-primary" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isPlyrHost ? (
                            <Crown size={14} className="text-warning animate-bounce" />
                          ) : (
                            <Shield size={14} className="text-base-content/40" />
                          )}
                          <span className={`text-xs font-mono font-black ${isSelf ? "text-primary" : ""}`}>
                            {plyr.username} {isSelf && "(YOU)"} {isBot && "[BOT]"}
                          </span>
                        </div>

                        {/* Host controls over other players */}
                        {isHost && !isSelf && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handlePromotePlayer(plyr.userId)}
                              title="Promote to Host"
                              className="btn btn-square btn-outline border border-base-content/60 btn-xs text-warning hover:bg-warning hover:text-warning-content"
                            >
                              ★
                            </button>
                            <button
                              onClick={() => handleKickPlayer(plyr.userId)}
                              title="Kick Agent"
                              className="btn btn-square btn-outline border border-base-content/60 btn-xs text-error hover:bg-error hover:text-error-content"
                            >
                              <UserMinus size={10} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Room Config / Launch Panel */}
              <div className="border-t-4 border-base-content pt-6 flex flex-col sm:flex-row gap-4 justify-between items-center bg-base-200 p-4 shadow-neo-sm">
                <div className="text-center sm:text-left">
                  <h4 className="text-xs font-mono font-black uppercase text-base-content">LOBBY_CONTROLLER: STATUS</h4>
                  <p className="text-[10px] font-mono text-base-content/60 mt-0.5">
                    {room.players.length < 6
                      ? `INSUFFICIENT AGENTS: NEED ${6 - room.players.length} MORE TO GENERATE ROLES`
                      : "READY TO INITIALIZE HISTORICAL PROTOCOL (6-15 players)"}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  {process.env.NODE_ENV !== "production" && isHost && room.players.length < 6 && (
                    <button
                      onClick={handleFillBots}
                      disabled={actionLoading}
                      className="btn btn-outline border-2 border-base-content btn-sm font-mono text-[10px] uppercase shadow-neo-sm"
                    >
                      [FILL WITH BOTS]
                    </button>
                  )}
                  {isHost ? (
                    <button
                      onClick={handleStartGame}
                      disabled={room.players.length < 6}
                      className="btn btn-primary border-2 border-base-content btn-sm font-mono text-[10px] uppercase shadow-neo-sm hover:translate-y-[-2px] hover:shadow-neo flex items-center gap-1.5"
                    >
                      <Play size={12} />
                      <span>START GAME</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="loading loading-xs loading-spinner text-secondary"></span>
                      <span className="text-[9px] font-mono font-bold uppercase text-base-content/75">
                        Waiting for Host to start...
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* =================================================== */
            /* GAME VIEW (IN_PROGRESS)                             */
            /* =================================================== */
            <div className="flex flex-col gap-6">
              
              {/* Game Stats Stripe */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex flex-col border-2 border-base-content bg-base-100 p-3 shadow-neo-sm relative">
                  <span className="text-[8px] font-mono text-base-content/50 uppercase">MISSION_ROUND</span>
                  <span className="text-lg font-black text-primary">ROUND {gameState?.roundNumber ?? 1} / 5</span>
                </div>
                <div className="flex flex-col border-2 border-base-content bg-base-100 p-3 shadow-neo-sm">
                  <span className="text-[8px] font-mono text-base-content/50 uppercase">SELECTOR</span>
                  <span className="text-xs font-mono font-black text-secondary truncate">
                    {room.players.find((p) => p.userId === gameState?.selectorId)?.username || "Unknown"}
                  </span>
                </div>
                <div className="flex flex-col border-2 border-base-content bg-base-100 p-3 shadow-neo-sm">
                  <span className="text-[8px] font-mono text-base-content/50 uppercase">SIRAJ (GREEN) SCORE</span>
                  <span className="text-lg font-black text-success">{room.greenWins} / 3 WINS</span>
                </div>
                <div className="flex flex-col border-2 border-base-content bg-base-100 p-3 shadow-neo-sm">
                  <span className="text-[8px] font-mono text-base-content/50 uppercase">BRITISH (RED) SCORE</span>
                  <span className="text-lg font-black text-error">{room.redWins} / 3 WINS</span>
                </div>
              </div>

              {/* SECRET DOSSIER (Your Role) */}
              {assignedRole && (
                <div className="border-4 border-base-content bg-base-100 shadow-neo relative p-4 space-y-3">
                  <div className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-2 border-l-2 border-error"></div>
                  <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-2 border-r-2 border-error"></div>
                  
                  <div className="flex items-center gap-2 border-b-2 border-base-content pb-2">
                    <Shield size={16} className="text-error" />
                    <h3 className="text-xs font-black font-mono uppercase tracking-wider text-error">
                      🕵️ CLASSIFIED_INFO: YOUR PRIVATE DOSSIER
                    </h3>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-md font-mono font-black uppercase text-secondary">
                          {ROLE_DESCRIPTIONS[assignedRole.role]?.name || assignedRole.role.toUpperCase()}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 border border-base-content uppercase rounded-md ${
                          assignedRole.team === "green" ? "bg-success text-success-content" : "bg-error text-error-content"
                        }`}>
                          {assignedRole.team.toUpperCase()} TEAM
                        </span>
                      </div>
                      <p className="text-[11px] text-base-content/85 mt-1 font-mono leading-relaxed">
                        {ROLE_DESCRIPTIONS[assignedRole.role]?.desc}
                      </p>
                      <p className="text-[10px] text-base-content/50 italic mt-0.5 font-mono">
                        {ROLE_DESCRIPTIONS[assignedRole.role]?.goals}
                      </p>
                    </div>

                    {/* Hidden knowledge reveals */}
                    {assignedRole.visiblePlayers && assignedRole.visiblePlayers.length > 0 && (
                      <div className="border border-base-content/30 bg-base-200 p-2 text-[10px] font-mono rounded-md w-full sm:max-w-xs shrink-0">
                        <span className="font-bold text-[9px] block uppercase text-secondary mb-1">👀 KNOWN INTEL:</span>
                        <div className="space-y-1">
                          {assignedRole.visiblePlayers.map((player) => {
                            const playerObj = room.players.find((p) => p.userId === player.userId);
                            return (
                              <div key={player.userId} className="flex justify-between border-b border-base-content/10 pb-0.5 last:border-b-0">
                                <span className="font-black">{playerObj?.username || "Agent"}</span>
                                <span className="opacity-70 font-bold">({player.role.replace("_", " ")})</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ACTION HUB & GAME LOOP VIEW */}
              <div className="flex flex-col border-4 border-base-content bg-base-100 shadow-neo relative p-6 space-y-6">
                <div className="absolute -top-1.5 -right-1.5 w-4 h-4 border-t-2 border-r-2 border-primary"></div>
                <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 border-b-2 border-l-2 border-secondary"></div>

                <div className="border-b-2 border-base-content pb-3 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-black uppercase flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                      <span>[ Active Mission Phase: {gameState?.phase} ]</span>
                    </h3>
                    <p className="text-[10px] font-mono text-base-content/60 mt-0.5">
                      Rejections: {gameState?.rejectionCount} / 5 (Game fails at 5 rejections)
                    </p>
                  </div>
                </div>

                {/* Game Loop rendering */}
                {gameState?.phase === "DISCUSSION" && (
                  <div className="space-y-4 font-mono text-xs">
                    {gameState.selectorId === session.user.id ? (
                      <div className="space-y-4">
                        <div className="border border-primary bg-primary/5 p-3 rounded-md">
                          <p className="font-black text-primary uppercase text-[10px]">⚡ YOUR ROLE: TEAM SELECTOR</p>
                          <p className="text-[10px] text-base-content/85 mt-1">
                            You are the selector for this round. Propose exactly{" "}
                            <span className="font-black text-secondary">{expectedTeamSize} players</span> to deploy on this mission.
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="font-bold text-[10px] block uppercase text-base-content/70">SELECT TEAM MEMBERS:</label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {room.players.map((plyr) => {
                              const isChecked = selectedTeamProposal.includes(plyr.userId);
                              return (
                                <button
                                  key={plyr.userId}
                                  type="button"
                                  onClick={() => toggleTeamSelection(plyr.userId)}
                                  className={`flex items-center justify-between p-2.5 border-2 text-left transition-all ${
                                    isChecked
                                      ? "border-secondary bg-secondary/5 font-black"
                                      : "border-base-content/40 hover:border-base-content bg-base-100"
                                  }`}
                                >
                                  <span>{plyr.username}</span>
                                  <div className={`w-4 h-4 border border-base-content flex items-center justify-center text-[10px] ${
                                    isChecked ? "bg-secondary text-secondary-content" : ""
                                  }`}>
                                    {isChecked && "✓"}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            onClick={submitTeamProposal}
                            disabled={selectedTeamProposal.length !== expectedTeamSize}
                            className="btn btn-secondary border-2 border-base-content font-bold uppercase text-xs shadow-neo-sm hover:translate-y-[-2px] hover:shadow-neo disabled:opacity-50 h-10 px-6"
                          >
                            SUBMIT PROPOSAL ({selectedTeamProposal.length} / {expectedTeamSize})
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-base-content/30 bg-base-200">
                        <Users className="text-secondary mb-3 animate-pulse" size={28} />
                        <h4 className="font-black uppercase text-xs">Selector Proposing Team</h4>
                        <p className="text-[10px] text-base-content/50 mt-1 max-w-sm leading-normal">
                          Wait for selector{" "}
                          <span className="font-black text-secondary">
                            {room.players.find((p) => p.userId === gameState.selectorId)?.username || "Agent"}
                          </span>{" "}
                          to propose a team of {expectedTeamSize} players for this round. Discuss and build trust!
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {gameState?.phase === "TEAM_APPROVAL" && (
                  <div className="space-y-4 font-mono text-xs">
                    <div className="border border-secondary bg-secondary/5 p-3 rounded-md">
                      <p className="font-black text-secondary uppercase text-[10px]">⚖️ LOBBY DECISION: APPROVE PROPOSED MISSION TEAM?</p>
                      <p className="text-[10px] text-base-content/85 mt-1 leading-normal">
                        Selector proposed team:{" "}
                        <span className="font-black text-primary">
                          {gameState.selectedTeam
                            .map((id) => room.players.find((p) => p.userId === id)?.username || "Agent")
                            .join(", ")}
                        </span>
                      </p>
                    </div>

                    {!hasVotedTeam ? (
                      <div className="space-y-3">
                        <p className="text-[10px] text-base-content/75 uppercase block text-center font-bold">CAST YOUR SIGN-OFF VOTE:</p>
                        <div className="flex gap-4 max-w-sm mx-auto">
                          <button
                            onClick={() => handleVoteTeam("reject")}
                            className="btn btn-outline btn-error flex-1 border-2 border-base-content font-bold uppercase text-xs shadow-neo-sm hover:translate-y-[-2px] hover:shadow-neo h-11"
                          >
                            <X size={14} className="mr-1" />
                            <span>REJECT</span>
                          </button>
                          <button
                            onClick={() => handleVoteTeam("approve")}
                            className="btn btn-success flex-1 border-2 border-base-content font-bold uppercase text-xs shadow-neo-sm hover:translate-y-[-2px] hover:shadow-neo h-11 text-success-content"
                          >
                            <Check size={14} className="mr-1" />
                            <span>APPROVE</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-4 border-2 border-dashed border-base-content/30 bg-base-200">
                        <span className="loading loading-xs loading-spinner text-primary mb-2"></span>
                        <p className="text-[10px] font-bold uppercase text-base-content/60">VOTE ENCRYPTED. WAITING FOR OTHER AGENTS...</p>
                      </div>
                    )}
                  </div>
                )}

                {gameState?.phase === "MISSION_VOTE" && (
                  <div className="space-y-4 font-mono text-xs">
                    <div className="border border-primary bg-primary/5 p-3 rounded-md">
                      <p className="font-black text-primary uppercase text-[10px]">🚀 ACTIVE LAUNCH: MISSION VOTE</p>
                      <p className="text-[10px] text-base-content/85 mt-1">
                        The approved team (
                        <span className="font-black text-secondary">
                          {gameState.selectedTeam
                            .map((id) => room.players.find((p) => p.userId === id)?.username || "Agent")
                            .join(", ")}
                        </span>
                        ) must now vote to pass or fail the mission.
                      </p>
                    </div>

                    {gameState.selectedTeam.includes(session.user.id) ? (
                      !hasVotedMission ? (
                        <div className="space-y-3">
                          <p className="text-[10px] text-error font-bold uppercase text-center block tracking-wider animate-pulse">
                            ⚠️ CAUTION: SECRET ENCRYPTED BALLOT
                          </p>
                          <p className="text-[9px] text-base-content/50 uppercase text-center block">
                            Green team MUST vote success. Red team can choose to pass or sabotage (fail).
                          </p>
                          <div className="flex gap-4 max-w-sm mx-auto">
                            <button
                              onClick={() => handleVoteMission("red")}
                              disabled={assignedRole?.team === "green"}
                              className="btn btn-error flex-1 border-2 border-base-content font-bold uppercase text-xs shadow-neo-sm hover:translate-y-[-2px] hover:shadow-neo h-11 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <X size={14} className="mr-1" />
                              <span>SABOTAGE (FAIL)</span>
                            </button>
                            <button
                              onClick={() => handleVoteMission("green")}
                              className="btn btn-success flex-1 border-2 border-base-content font-bold uppercase text-xs shadow-neo-sm hover:translate-y-[-2px] hover:shadow-neo h-11 text-success-content"
                            >
                              <Check size={14} className="mr-1" />
                              <span>SUCCESS (PASS)</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center p-4 border-2 border-dashed border-base-content/30 bg-base-200">
                          <p className="text-[10px] font-bold text-success uppercase">✓ BALLOT TRANSMITTED. WAITING FOR RESULTS...</p>
                        </div>
                      )
                    ) : (
                      <div className="text-center p-6 border-2 border-dashed border-base-content/30 bg-base-200">
                        <span className="loading loading-xs loading-spinner text-primary mb-2"></span>
                        <p className="text-[10px] font-bold uppercase text-base-content/60">
                          MISSION IN PROGRESS. MISSION TEAM MEMBERS ARE VOTING...
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {gameState?.phase === "FINISHED" && (
                  <div className="space-y-4 font-mono text-xs text-center p-6 border-4 border-double border-base-content bg-base-200">
                    <h2 className="text-xl font-black uppercase text-primary">
                      ⚡ HISTORICAL RECOGNITION: PROTOCOL_END
                    </h2>
                    <p className="text-md uppercase font-black tracking-widest text-secondary mt-2">
                      {gameState.winner === "green" ? "NAWAB SIRAJ-UD-DAULAH (GREEN) WINS!" : "BRITISH ALLIES & TRAITOR (RED) WIN!"}
                    </p>
                    <p className="text-[10px] text-base-content/50 max-w-sm mx-auto leading-normal mt-1">
                      Check client chat and history logs for complete assignment analysis and player debriefs.
                    </p>
                    <div className="pt-4 flex justify-center">
                      <button
                        onClick={() => router.push("/home")}
                        className="btn btn-outline border-2 border-base-content font-bold uppercase text-xs shadow-neo-sm hover:translate-y-[-2px]"
                      >
                        RETURN TO HOME BASE
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Room Comms & Invitations */}
        <div className="flex flex-col gap-6 lg:max-w-xs shrink-0 w-full lg:w-72">
          
          {/* Invite Drawer (Lobby mode only) */}
          {!isGameMode && (
            <div className="flex flex-col border-4 border-base-content bg-base-100 shadow-neo relative">
              <div className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-2 border-l-2 border-secondary"></div>
              
              <div className="bg-diagonal-hatch h-6 border-b-2 border-base-content flex items-center justify-between px-3 text-[9px] font-mono font-bold tracking-wider text-base-content/85 select-none">
                <span className="flex items-center gap-1">
                  <UserPlus size={10} className="text-secondary" />
                  <span>RADAR: INVITE AGENTS</span>
                </span>
                <span>COMMS</span>
              </div>

              <div className="p-3 max-h-[160px] overflow-y-auto bg-base-100">
                {onlineUsers.filter((u) => u.userId !== session.user.id && !u.roomId).length === 0 ? (
                  <p className="text-[9px] font-mono text-base-content/50 uppercase italic text-center p-2 leading-relaxed">
                    No idle agents online to invite.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {onlineUsers.map((user) => {
                      if (user.userId === session.user.id || user.roomId) return null;
                      return (
                        <div
                          key={user.userId}
                          className="flex items-center justify-between p-2 border border-base-content bg-base-200 text-[10px] font-mono shadow-neo-sm"
                        >
                          <span className="font-bold truncate max-w-[120px]">{user.username}</span>
                          <button
                            onClick={() => {
                              if (socketRef.current && room) {
                                socketRef.current.emit("room:invite", {
                                  targetUserId: user.userId,
                                  roomId: room.id,
                                  roomCode: room.code,
                                  hostName: session.user.name,
                                });
                              }
                            }}
                            className="btn btn-xs btn-primary border border-base-content text-[8px] font-black uppercase"
                          >
                            INVITE
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Private Room Chat logs */}
          <div className="flex-1 flex flex-col overflow-hidden border-4 border-base-content bg-base-100 shadow-neo relative min-h-[300px] max-h-[480px]">
            {/* Corner Angle Brackets */}
            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 border-t-2 border-r-2 border-primary"></div>
            <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 border-b-2 border-l-2 border-secondary"></div>

            <div className="bg-diagonal-hatch h-6 shrink-0 border-b-2 border-base-content flex items-center justify-between px-3 text-[9px] font-mono font-bold tracking-wider text-base-content/80 select-none">
              <span>LOBBY_CHAT_LINK</span>
              <span>PRIVATE_COMMS</span>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-3 bg-base-100 font-mono text-[10px]">
              {chatMessages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center p-4">
                  <MessageSquare size={18} className="text-base-content/40 mb-2" />
                  <p className="uppercase text-[9px] font-bold text-base-content/40">ROOM_CHAT: EMPTY</p>
                  <p className="text-[8px] text-base-content/50 uppercase mt-0.5 leading-normal">
                    Transmit a secret command or greeting!
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {chatMessages.map((msg, index) => {
                    const isOwn = msg.username === session.user.name;
                    return (
                      <div key={index} className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                        {!isOwn && (
                          <span className="mb-0.5 font-bold text-[8px] uppercase text-secondary">
                            {msg.username}
                          </span>
                        )}
                        <div
                          className={`max-w-[90%] px-2.5 py-1.5 border border-base-content shadow-neo-sm break-words ${
                            isOwn
                              ? "rounded-lg rounded-tr-none bg-primary text-primary-content font-bold"
                              : "rounded-lg rounded-tl-none bg-base-200 text-base-content"
                          }`}
                        >
                          {msg.text}
                        </div>
                        <span className="mt-0.5 text-[7px] text-base-content/40 uppercase font-bold">
                          [{formatTime(msg.timestamp)}]
                        </span>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input Form */}
            <form
              onSubmit={handleSendRoomMessage}
              className="flex gap-1.5 border-t-2 border-base-content bg-base-100 p-2 shrink-0"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Talk in room..."
                className="flex-1 border border-base-content bg-base-100 px-2 py-1 font-mono text-[10px] shadow-neo-sm focus:outline-none focus:translate-y-[-1px]"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="btn btn-square btn-primary border border-base-content btn-sm shadow-neo-sm flex items-center justify-center disabled:opacity-40"
              >
                <Send size={10} />
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
