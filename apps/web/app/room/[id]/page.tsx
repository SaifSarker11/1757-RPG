"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import InfoModal from "@/components/InfoModal";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { authClient } from "@/lib/auth-client";
import { gameAudio } from "@/lib/audio";
import type { PlayerView } from "@/lib/game-types";
import { CountdownTimer } from "@/components/CountdownTimer";
import { RoleCard } from "@/components/RoleCard";
import { RoundTracker } from "@/components/RoundTracker";
import { ActionPanel } from "@/components/ActionPanel";
import { PostGameSummary } from "@/components/PostGameSummary";
import { NominationHistoryCard } from "@/components/NominationHistoryCard";
import { CustomRoomSettings } from "@/components/CustomRoomSettings";
import { VoiceChatPanel } from "@/components/VoiceChatPanel";
import { useVoiceChat } from "@/lib/useVoiceChat";
import { MusicControl } from "@/components/MusicControl";
import { musicPlayer } from "@/lib/music";

interface PlayerInfo {
  userId: string;
  name: string;
  isHost: boolean;
  role?: string;
  team?: string;
  isSelector?: boolean;
}

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: string;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3001";
const API_URL =
  typeof window !== "undefined"
    ? ""
    : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001");

const THEMES = [
  "light", "dark", "cupcake", "bumblebee", "emerald", "corporate", "synthwave",
  "retro", "cyberpunk", "valentine", "halloween", "garden", "forest", "aqua",
  "lofi", "pastel", "fantasy", "wireframe", "black", "luxury", "dracula",
  "cmyk", "autumn", "business", "acid", "lemon", "night", "coffee", "winter",
  "dim", "nord", "sunset"
];

function getTeamSizeForRound(roundNumber: number, playerCount: number): number {
  const sizes: Record<number, number[]> = {
    6:  [2, 3, 4, 3, 4],
    7:  [2, 3, 3, 4, 4],
    8:  [3, 4, 4, 5, 5],
    9:  [3, 4, 4, 5, 5],
    10: [3, 4, 4, 5, 5],
    11: [3, 4, 5, 5, 6],
    12: [4, 5, 5, 6, 6],
    13: [4, 5, 6, 6, 7],
    14: [4, 6, 6, 7, 7],
    15: [5, 6, 7, 7, 8]
  };
  const roundIndex = roundNumber - 1;
  const playerSizes = sizes[playerCount] ?? sizes[6];
  return playerSizes[roundIndex] ?? 3;
}

const CHARACTER_ROLES = [
  { name: "Nawab Siraj", team: "Green", power: "Sees Lutfunnesa. If Tara Bai is in the game, sees two Lutfunnesas (confused)." },
  { name: "Lutfunnesa", team: "Green", power: "Sees Nawab Siraj. If Tara Bai is in the game, sees two Nawabs (confused)." },
  { name: "Mir Madan", team: "Green", power: "Sees Red team players (except Rai Durlabh) during the first round discussion." },
  { name: "Mohon Lal", team: "Green", power: "Sees both Mir Madan and Ghasheti Begum as generic 'spies' (doesn't know who is who)." },
  { name: "Saint Frais", team: "Green", power: "His approval votes and mission votes carry double weight (counts as 2)." },
  { name: "De Bussy", team: "Green", power: "Can lock onto another player once per game to mutually reveal roles." },
  { name: "Mir Jafar", team: "Red", power: "Leader of Red. If Green wins 3 rounds, gets one chance to guess Mir Madan to steal the win." },
  { name: "Ghasheti Begum", team: "Red", power: "Conspiratorial spy. Appears to Mohon Lal alongside Mir Madan to confuse him." },
  { name: "Jean Law", team: "Red", power: "Can curse a player once per game. Cursed green player wins if Red wins, loses if Green wins." },
  { name: "Yar Lutuf", team: "Red", power: "His approval votes and mission votes carry double weight (counts as 2)." },
  { name: "Tara Bai", team: "Red", power: "Confuses Nawab Siraj and Lutfunnesa by appearing as their fake partner." },
  { name: "Umichad", team: "Red", power: "Lone wolf. Has no idea who the other Red conspirators are." },
  { name: "Rai Durlabh", team: "Red", power: "Completely invisible. Roles/details cannot be seen by any vision (except De Bussy reveal)." },
  { name: "Jagat Seth", team: "Gold", power: "Chaos banker. If Red wins, guesses Rai Durlabh; if Green wins, guesses Mir Jafar to win alone." },
  { name: "Raja Ramnarain", team: "Green", power: "Governor of Patna. Can see Nawab Siraj throughout the game." }
];

export default function RoomPage(props: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const params = React.use(props.params);
  const roomId = params.id;

  const { data: session, isPending } = authClient.useSession();
  const socketRef = useRef<Socket | null>(null);
  // Mirrors socketRef so hooks that subscribe to the socket re-run when it changes.
  const [socket, setSocket] = useState<Socket | null>(null);

  // Theme selector state
  const [currentTheme, setCurrentTheme] = useState("retro");

  // Game States (Authoritative Server View)
  const [playerView, setPlayerView] = useState<PlayerView | null>(null);
  const [gameError, setGameError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [roomData, setRoomData] = useState<any>(null);
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [myRoleInfo, setMyRoleInfo] = useState<any>(null);
  const [currentPhase, setCurrentPhase] = useState<string>("LOBBY");
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [discussionTimer, setDiscussionTimer] = useState<number>(120);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [currentSelectorId, setCurrentSelectorId] = useState<string>("");
  const [proposedTeam, setProposedTeam] = useState<string[]>([]);
  const [hasVotedApproval, setHasVotedApproval] = useState<boolean>(false);
  const [hasVotedMission, setHasVotedMission] = useState<boolean>(false);
  const [voteLogs, setVoteLogs] = useState<any[]>([]);
  const [finalWinner, setFinalWinner] = useState<string | null>(null);
  const [roleReveal, setRoleReveal] = useState<any[]>([]);
  const [excludedWinCredit, setExcludedWinCredit] = useState<string[]>([]);
  const [rolesInPlay, setRolesInPlay] = useState<string[]>([]);

  // Online status mapping
  const [onlinePlayers, setOnlinePlayers] = useState<Record<string, boolean>>({});

  // Refs for socket callbacks to avoid re-connecting the socket when variables change
  const roundNumberRef = useRef(roundNumber);
  const proposedTeamRef = useRef(proposedTeam);

  // sound and transition states
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [phaseTransitionText, setPhaseTransitionText] = useState<string | null>(null);
  const [activeRolesOnly, setActiveRolesOnly] = useState<boolean>(true);
  const [rightSidebarTab, setRightSidebarTab] = useState<"chat" | "chronicle" | "voice">("chat");

  useEffect(() => {
    roundNumberRef.current = roundNumber;
  }, [roundNumber]);

  useEffect(() => {
    proposedTeamRef.current = proposedTeam;
  }, [proposedTeam]);

  // Special Lock statuses
  const [deBussyScanned, setDeBussyScanned] = useState<{ targetUserId: string; role: string | null } | null>(null);
  const [jeanLawConfirmed, setJeanLawConfirmed] = useState<string | null>(null);

  // Guess Prompts
  const [mirJafarGuessActive, setMirJafarGuessActive] = useState<boolean>(false);
  const [jagatSethGuessActive, setJagatSethGuessActive] = useState<boolean>(false);
  const [jagatSethTargetTeam, setJagatSethTargetTeam] = useState<string | null>(null);

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Info Modal
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("daisyui-theme") || "retro";
    setCurrentTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
    setSoundEnabled(gameAudio.isEnabled());
  }, []);

  const changeTheme = (themeName: string) => {
    gameAudio.playClick();
    setCurrentTheme(themeName);
    localStorage.setItem("daisyui-theme", themeName);
    document.documentElement.setAttribute("data-theme", themeName);
  };

  const toggleSound = () => {
    const nextVal = !soundEnabled;
    gameAudio.setEnabled(nextVal);
    setSoundEnabled(nextVal);
  };

  const fetchRoom = async () => {
    try {
      const res = await fetch(`${API_URL}/rooms/${roomId}`);
      if (res.ok) {
        const data = await res.json();
        setRoomData(data);
        setRolesInPlay(data.rolesInPlay || []);
        
        const mappedPlayers = data.players.map((p: any) => {
          return {
            userId: p.userId,
            name: p.name,
            isHost: data.hostUserId === p.userId,
            isSelector: false,
          };
        });
        setPlayers(mappedPlayers);
      }
    } catch (err) {
      console.error("Error fetching room details:", err);
    }
  };

  // Fetch initial room info
  useEffect(() => {
    if (!session && !isPending) {
      router.replace("/login");
      return;
    }
    if (session) {
      fetchRoom();
    }
  }, [roomId, session, isPending]);

  // Phase change transition effect triggers
  useEffect(() => {
    if (currentPhase === "LOBBY") return;
    gameAudio.playPhaseChange();

    let friendlyName = currentPhase.replace(/_/g, " ");
    if (currentPhase === "DISCUSSION") friendlyName = `Round ${roundNumber}: Discussion Phase`;
    if (currentPhase === "TEAM_PROPOSAL") friendlyName = `Round ${roundNumber}: Propose Council`;
    if (currentPhase === "TEAM_APPROVAL") friendlyName = `Round ${roundNumber}: Approval Voting`;
    if (currentPhase === "MISSION_VOTE") friendlyName = `Round ${roundNumber}: Secretariat Resolution`;
    if (currentPhase === "ENDGAME") friendlyName = `Chamber Endgame!`;

    setPhaseTransitionText(friendlyName);
    const timer = setTimeout(() => {
      setPhaseTransitionText(null);
    }, 2200);
    return () => clearTimeout(timer);
  }, [currentPhase, roundNumber]);

  // Socket Connections (Runs exactly once on mount, depends only on roomId and session)
  useEffect(() => {
    if (!session?.user?.id) return;

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      withCredentials: true,
      query: { roomId, userId: session.user.id },
    });

    socketRef.current = socket;
    setSocket(socket);

    socket.emit("room:join", { roomId });

    // Sync game view on connect/reconnect
    socket.emit("game:sync", { roomId });

    socket.on("game:view", (payload: { roomId: string; view: PlayerView }) => {
      if (payload.roomId === roomId && payload.view) {
        setPlayerView(payload.view);
        setCurrentPhase(payload.view.game.phase);
        setRoundNumber(payload.view.game.round);
      }
    });

    socket.on("game:error", (err: { code: string; message: string }) => {
      setGameError(err.message || err.code);
      setTimeout(() => setGameError(null), 4000);
    });

    socket.on("game:event", (payload: { roomId: string; events: any[] }) => {
      if (payload.roomId === roomId) {
        for (const evt of payload.events) {
          if (evt.type === "MISSION_RESOLVED") {
            if (evt.winner === "GREEN") gameAudio.playSuccess();
            else gameAudio.playFailure();
          } else if (evt.type === "GAME_ENDED") {
            gameAudio.playVictory();
          }
        }
      }
    });

    socket.on("room:chat-history", (history: ChatMessage[]) => {
      setMessages(history);
    });

    socket.on("room:update", (data: any) => {
      setRoomData(data);
      setRolesInPlay(data.rolesInPlay || []);
      
      const mapped = data.players.map((p: any) => ({
        userId: p.userId,
        name: p.name,
        isHost: data.hostUserId === p.userId,
        isSelector: false,
      }));
      setPlayers(mapped);
    });

    socket.on("room:online-list", (list: string[]) => {
      const activeMapping: Record<string, boolean> = {};
      list.forEach((uId) => {
        activeMapping[uId] = true;
      });
      setOnlinePlayers(activeMapping);
    });

    socket.on("player:status", (status: { userId: string; online: boolean }) => {
      setOnlinePlayers((prev) => ({
        ...prev,
        [status.userId]: status.online,
      }));
    });

    socket.on("chat:message", (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("game:started", () => {
      socket.emit("game:sync", { roomId });
      fetchRoom();
    });

    socket.on("role:assigned", (info: any) => {
      setMyRoleInfo(info);
    });

    socket.on("round:mirMadanVision", (vision: any) => {
      setMyRoleInfo((prev: any) => ({
        ...prev,
        visiblePlayers: vision.visiblePlayers,
      }));
    });

    socket.on("round:phase", (payload: { phase: string; round: number; duration: number }) => {
      setCurrentPhase(payload.phase);
      setRoundNumber(payload.round);
      if (payload.phase === "DISCUSSION") {
        setDiscussionTimer(payload.duration);
        setHasVotedApproval(false);
        setHasVotedMission(false);
        setProposedTeam([]);
      }
    });

    socket.on("round:teamProposed", (payload: { playerIds: string[] }) => {
      setProposedTeam(payload.playerIds);
      setCurrentPhase("TEAM_APPROVAL");
    });

    socket.on("round:approvalResult", (payload: { approved: boolean }) => {
      setVoteLogs((prev) => [
        ...prev,
        {
          type: "approval",
          round: roundNumberRef.current,
          approved: payload.approved,
          members: proposedTeamRef.current,
        },
      ]);
      if (payload.approved) {
        setCurrentPhase("MISSION_VOTE");
        gameAudio.playSuccess();
      } else {
        setCurrentPhase("DISCUSSION");
        gameAudio.playFailure();
      }
    });

    socket.on("round:mission-vote-complete", (payload: { winner: string }) => {
      setVoteLogs((prev) => [
        ...prev,
        {
          type: "mission",
          round: roundNumberRef.current,
          winner: payload.winner,
          members: proposedTeamRef.current,
        },
      ]);
      setHasVotedMission(false);
      if (payload.winner === "green") {
        gameAudio.playSuccess();
      } else {
        gameAudio.playFailure();
      }
    });

    socket.on("round:transition", (payload: { round: number; selectorId: string }) => {
      setRoundNumber(payload.round);
      setCurrentSelectorId(payload.selectorId);
    });

    socket.on("debussy:reveal", (payload: { targetUserId: string; revealedRole: string | null }) => {
      setDeBussyScanned({ targetUserId: payload.targetUserId, role: payload.revealedRole });
    });

    socket.on("jeanlaw:lockConfirmed", (payload: { targetUserId: string }) => {
      setJeanLawConfirmed(payload.targetUserId);
    });

    socket.on("guess:mirJafarPrompt", () => {
      setMirJafarGuessActive(true);
    });

    socket.on("guess:jagatSethPrompt", (payload: { targetTeam: string }) => {
      setJagatSethGuessActive(true);
      setJagatSethTargetTeam(payload.targetTeam);
    });

    socket.on("game:end", (payload: any) => {
      setFinalWinner(payload.winner);
      setRoleReveal(payload.roleReveal);
      setExcludedWinCredit(payload.excludedWinCredit);
      setCurrentPhase("ENDGAME");
      gameAudio.playVictory();
    });

    return () => {
      socket.disconnect();
      setSocket(null);
    };
  }, [roomId, session]);

  // Lives here, not in the tab, so switching tabs doesn't drop the call.
  const voice = useVoiceChat(socket, roomId);

  // Background music pauses while anyone in this room is in voice chat.
  const voiceActive = voice.participants.length > 0;
  useEffect(() => {
    musicPlayer.setSuppressed("voice", voiceActive);
    return () => musicPlayer.setSuppressed("voice", false);
  }, [voiceActive]);

  // Discussion countdown timer
  useEffect(() => {
    if (currentPhase !== "DISCUSSION" || discussionTimer <= 0) return;
    
    if (discussionTimer <= 10) {
      gameAudio.playTimerTick();
    }

    const interval = setInterval(() => {
      setDiscussionTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [currentPhase, discussionTimer]);

  // Auto transition to team proposal once discussion ends
  useEffect(() => {
    if (currentPhase === "DISCUSSION" && discussionTimer === 0) {
      setCurrentPhase("TEAM_PROPOSAL");
    }
  }, [currentPhase, discussionTimer]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const emitGameAction = (action: any) => {
    gameAudio.playClick();
    if (!socketRef.current) return;
    setActionLoading(true);
    socketRef.current.emit(
      "game:action",
      { roomId, action },
      (ack: { ok: boolean; error?: { message: string } }) => {
        setActionLoading(false);
        if (!ack?.ok && ack?.error) {
          setGameError(ack.error.message);
          setTimeout(() => setGameError(null), 4000);
        }
      }
    );
  };

  const handleStartGame = () => {
    gameAudio.playClick();
    if (socketRef.current) {
      setActionLoading(true);
      socketRef.current.emit("game:start", { roomId }, (ack: { ok: boolean; error?: { message: string } }) => {
        setActionLoading(false);
        if (!ack?.ok && ack?.error) {
          setGameError(ack.error.message);
          setTimeout(() => setGameError(null), 4000);
        }
      });
    }
  };

  /** Custom rooms: the host ends the current timer now. */
  const handleSkip = () => {
    gameAudio.playClick();
    if (!socketRef.current) return;
    setActionLoading(true);
    socketRef.current.emit("game:skip", { roomId }, (ack: { ok: boolean; error?: { message: string } }) => {
      setActionLoading(false);
      if (!ack?.ok && ack?.error) {
        setGameError(ack.error.message);
        setTimeout(() => setGameError(null), 4000);
      }
    });
  };

  /** Custom rooms: the host freezes or restarts the timer for everyone. */
  const handleTogglePause = () => {
    gameAudio.playClick();
    if (!socketRef.current) return;
    setActionLoading(true);
    const event = isPaused ? "game:resume" : "game:pause";
    socketRef.current.emit(event, { roomId }, (ack: { ok: boolean; error?: { message: string } }) => {
      setActionLoading(false);
      if (!ack?.ok && ack?.error) {
        setGameError(ack.error.message);
        setTimeout(() => setGameError(null), 4000);
      }
    });
  };

  const handleNominate = (ministerIds: string[]) => {
    emitGameAction({ type: "NOMINATE", ministerIds });
  };

  const handleCastVote = (vote: "APPROVE" | "REJECT") => {
    emitGameAction({ type: "CAST_VOTE", vote });
  };

  const handlePlayCard = (card: "SUCCESS" | "SABOTAGE") => {
    emitGameAction({ type: "PLAY_CARD", card });
  };

  const handleDeBussyReveal = (targetId: string) => {
    emitGameAction({ type: "DEBUSSY_REVEAL", targetId });
  };

  const handleJeanLawLock = (targetId: string) => {
    emitGameAction({ type: "JEANLAW_LOCK", targetId });
  };

  const handleGuess = (targetId: string) => {
    emitGameAction({ type: "GUESS", targetId });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socketRef.current || !session?.user) return;
    socketRef.current.emit("chat:send-message", {
      roomId,
      userId: session.user.id,
      username: session.user.name,
      text: inputText,
    });
    setInputText("");
  };

  const handleLeaveRoom = async () => {
    gameAudio.playClick();
    if (!session?.user) return;
    try {
      await fetch(`${API_URL}/rooms/${roomId}/leave`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id }),
      });
      if (socketRef.current) {
        socketRef.current.emit("room:leave", { roomId, userId: session.user.id });
      }
      router.push("/home");
    } catch (err) {
      console.error("Error leaving room:", err);
    }
  };

  const getPlayerAngle = (index: number, total: number) => {
    const startAngle = -Math.PI / 2; // top of circle
    return startAngle + (index * 2 * Math.PI) / total;
  };

  const isHost = roomData?.hostUserId === session?.user.id;
  const isCustomRoom = roomData?.mode === "CUSTOM";
  const isPaused = playerView?.game.pausedRemainingMs != null;
  const hasTimer = !!playerView?.game.endsAt || isPaused;
  const canSkip = isCustomRoom && isHost && hasTimer && playerView?.game.phase !== "POST_GAME";
  const canPause = canSkip;
  const isMyTurnToSelect = currentSelectorId === session?.user.id || (roomData?.hostUserId === session?.user.id && currentSelectorId === "");
  const sizeToSelect = getTeamSizeForRound(roundNumber, players.length);

  if (isPending || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-900 text-amber-500 font-retro">
        <div className="text-center font-sans">
          <span className="loading loading-spinner loading-lg text-amber-500 mb-4"></span>
          <p className="text-2xl font-bold tracking-widest">UNROLLING OLD SCROLLS...</p>
        </div>
      </div>
    );
  }

  const activeRolesFilter = activeRolesOnly && rolesInPlay.length > 0
    ? CHARACTER_ROLES.filter(r => rolesInPlay.some(rip => rip.replace(/_/g, " ").toLowerCase() === r.name.toLowerCase()))
    : CHARACTER_ROLES;

  return (
    <main className="min-h-screen bg-base-200 text-base-content font-sans p-4 md:p-6 flex flex-col items-center scanlines">
      
      {/* Phase Transition text overlay */}
      {phaseTransitionText && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[100] animate-fade-in pointer-events-none">
          <div className="w-full bg-primary py-8 text-center border-y-8 border-double border-primary-content glow-primary transform scale-y-100 transition-all duration-300">
            <h2 className="text-3xl md:text-5xl font-historical font-extrabold tracking-widest text-primary-content uppercase font-pixel drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">
              {phaseTransitionText}
            </h2>
          </div>
        </div>
      )}

      {/* Decorative Game Header */}
      <div className="navbar bg-base-100 border-4 border-primary shadow-[4px_4px_0px_0px_var(--color-primary)] rounded-none w-full max-w-7xl px-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1">
          <span className="font-historical text-2xl font-extrabold tracking-wide uppercase text-primary drop-shadow">Battle of Plassey 1757</span>
        </div>

        <div className="flex-none flex flex-wrap items-center justify-center gap-3">
          <button 
            onClick={toggleSound}
            className={`btn btn-sm btn-outline rounded-none border-2 font-pixel ${soundEnabled ? "btn-accent text-accent-content" : ""}`}
          >
            {soundEnabled ? "SFX: ON 🔊" : "SFX: OFF 🔇"}
          </button>

          <MusicControl />

          {hasTimer && (
            <CountdownTimer endsAt={playerView?.game.endsAt ?? null} pausedRemainingMs={playerView?.game.pausedRemainingMs ?? null} />
          )}

          {canPause && (
            <button
              onClick={handleTogglePause}
              disabled={actionLoading}
              title={isPaused ? "Restart the timer for everyone" : "Freeze the timer for everyone"}
              className={`btn btn-sm rounded-none border-2 font-pixel ${isPaused ? "btn-success" : "btn-info"}`}
            >
              {isPaused ? "RESUME ▶" : "PAUSE ⏸"}
            </button>
          )}

          {canSkip && (
            <button
              onClick={handleSkip}
              disabled={actionLoading}
              title="End the current timer now"
              className="btn btn-warning btn-sm rounded-none border-2 font-pixel"
            >
              SKIP ⏭
            </button>
          )}

          {isCustomRoom && !playerView && (
            <span className="badge badge-secondary rounded-none font-pixel text-[9px] py-3">ROYAL DECREE</span>
          )}

          <span className="bg-neutral text-neutral-content px-3 py-1.5 border border-base-300 text-xs font-pixel">
            Code: {roomData?.code ?? roomId.slice(0, 6)}
          </span>

          {/* Theme Dropdown */}
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-outline btn-sm rounded-none border-2 font-pixel">
              Theme: {currentTheme}
            </div>
            <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-none z-10 w-52 p-2 shadow-lg border-2 border-base-300 max-h-60 overflow-y-auto">
              {THEMES.map((themeName) => (
                <li key={themeName}>
                  <button onClick={() => changeTheme(themeName)} className="capitalize font-mono">
                    {themeName}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => { gameAudio.playClick(); setShowInfoModal(true); }}
            className="btn btn-primary btn-sm rounded-none border-2 font-pixel"
          >
            INFO CODES
          </button>

          <button
            onClick={handleLeaveRoom}
            className="btn btn-error btn-sm rounded-none border-2 font-pixel"
          >
            LEAVE
          </button>
        </div>
      </div>

      {isPaused && (
        <div className="alert alert-info text-xs font-pixel py-2 rounded-none border-2 border-info w-full max-w-7xl mb-4 justify-center">
          <span>⏸ THE HOST HAS PAUSED THE COUNCIL. TIMERS ARE FROZEN AND NO ONE CAN ACT UNTIL IT RESUMES.</span>
        </div>
      )}

      {gameError && (
        <div className="alert alert-error text-xs font-pixel py-2 rounded-none border-2 border-error w-full max-w-7xl mb-4">
          <span>{gameError}</span>
        </div>
      )}

      {/* Round & Sabotage Progress Tracker Banner */}
      {playerView ? (
        <div className="w-full max-w-7xl mb-6">
          <RoundTracker view={playerView} />
        </div>
      ) : (
        <div className="bg-base-100 border-4 border-primary p-3 flex flex-col md:flex-row justify-between items-center w-full max-w-7xl mb-6 pixel-card font-pixel text-xs gap-4">
          <span className="text-secondary font-bold uppercase tracking-wider">CHAMBER STATUS:</span>
          <span className="text-base-content/80 font-sans">
            Council convening. Awaiting start of round by host.
          </span>
        </div>
      )}

      {/* Main Grid View */}
      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* COLUMN 1: Virtual Council Tent (Circular Game Table) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-base-100 border-4 border-base-content/20 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.15)] p-6 relative overflow-hidden flex flex-col items-center justify-center min-h-[460px] pixel-card">
            
            <h2 className="text-xl font-historical font-extrabold text-primary uppercase tracking-widest border-b-2 border-dashed pb-2 mb-4 w-full text-center border-base-content/20">
              The Nawab's Secretariat Tent
            </h2>

            {/* Simulated 2D Oval Council Table */}
            <div className="relative w-full aspect-[4/3] max-w-md md:max-w-xl mx-auto flex items-center justify-center min-h-[300px] border-4 border-dashed border-amber-900/20 bg-amber-950/5 p-4 rounded-none">
              
              {/* Inner Round Table Graphic */}
              <div className="absolute w-[50%] h-[50%] border-4 border-double border-amber-800/40 rounded-full flex flex-col items-center justify-center text-center p-4 bg-amber-900/10">
                <span className="text-[10px] font-pixel text-amber-700/60 uppercase">Secretariat</span>
                <span className="text-[8px] font-pixel text-stone-500/70 uppercase mt-0.5">Plassey 1757</span>
              </div>

              {/* Render Players as seats around the council table */}
              {players.map((p, idx) => {
                const angle = getPlayerAngle(idx, players.length);
                const rx = 135; // horizontal radius
                const ry = 95;  // vertical radius
                const tx = rx * Math.cos(angle);
                const ty = ry * Math.sin(angle);

                const isOnline = onlinePlayers[p.userId] !== false;
                const isSelected = selectedPlayers.includes(p.userId);
                const isLeader = currentSelectorId === p.userId;
                const isOnProposedBoard = proposedTeam.includes(p.userId);
                
                return (
                  <div 
                    key={p.userId}
                    style={{
                      transform: `translate(${tx}px, ${ty}px)`
                    }}
                    className="absolute flex flex-col items-center z-20 group transition-all duration-300"
                  >
                    {/* Visual shield / portrait container */}
                    <div 
                      onClick={() => {
                        if (currentPhase === "TEAM_PROPOSAL" && isMyTurnToSelect) {
                          gameAudio.playClick();
                          setSelectedPlayers((prev) =>
                            prev.includes(p.userId)
                              ? prev.filter((id) => id !== p.userId)
                              : [...prev, p.userId]
                          );
                        }
                      }}
                      className={`w-14 h-14 border-4 flex flex-col items-center justify-center text-center bg-base-100 shadow-md relative rounded-none transition-all ${
                        isSelected ? "border-primary scale-110 glow-primary" :
                        isOnProposedBoard ? "border-accent scale-105" :
                        isLeader ? "border-secondary scale-105 animate-pulse" :
                        "border-base-content/20"
                      }`}
                    >
                      <span className="text-xl">
                        {p.isHost ? "👑" : "🛡️"}
                      </span>

                      {/* Vote state badge */}
                      {isOnProposedBoard && (
                        <span className="absolute -top-3.5 bg-accent text-accent-content border border-base-300 text-[7px] font-pixel px-1 uppercase">
                          BOARD
                        </span>
                      )}

                      {isLeader && (
                        <span className="absolute -top-3.5 bg-secondary text-secondary-content border border-base-300 text-[7px] font-pixel px-1 uppercase">
                          LEADER
                        </span>
                      )}

                      {/* Voice: mic badge, green while talking */}
                      {(() => {
                        const inVoice = voice.participants.filter((v) => v.userId === p.userId);
                        if (inVoice.length === 0) return null;
                        const talking = inVoice.some((v) => !v.muted && voice.isSpeaking(v.socketId));
                        const allMuted = inVoice.every((v) => v.muted);
                        return (
                          <span
                            title={allMuted ? "In voice (muted)" : "In voice"}
                            className={`absolute -bottom-1 -left-1 text-[10px] leading-none px-0.5 border ${
                              talking ? "bg-success border-success scale-125" : "bg-base-100 border-base-content/20"
                            } transition-transform`}
                          >
                            {allMuted ? "🔇" : "🎙️"}
                          </span>
                        );
                      })()}

                      {/* Connection marker */}
                      <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-base-100 rounded-full ${isOnline ? "bg-success" : "bg-neutral opacity-60"}`} />
                    </div>

                    {/* Character Tag label */}
                    <span className="bg-base-300 border border-base-content/10 px-1 py-0.5 mt-1 font-pixel text-[8px] max-w-[80px] truncate text-center uppercase text-base-content font-bold">
                      {p.name}
                    </span>
                  </div>
                );
              })}
            </div>
            
            {/* Private Role HUD Card embedded inside table */}
            {myRoleInfo && (
              <div className="w-full bg-base-200 border-2 border-primary/20 p-3 mt-4 flex flex-col sm:flex-row justify-between items-center gap-3 font-pixel">
                <div className="text-center sm:text-left">
                  <span className="text-[8px] text-base-content/65 block uppercase tracking-wider">Your Secret Seal:</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-historical font-extrabold uppercase text-primary">{myRoleInfo.role.replace("_", " ")}</span>
                    <span className={`badge badge-sm rounded-none border text-[8px] uppercase ${
                      myRoleInfo.team === "green" ? "bg-emerald-950 text-emerald-200" :
                      myRoleInfo.team === "red" ? "bg-rose-950 text-rose-200" : "bg-amber-950 text-amber-200"
                    }`}>
                      {myRoleInfo.team} Team
                    </span>
                  </div>
                </div>

                {myRoleInfo.visiblePlayers && myRoleInfo.visiblePlayers.length > 0 && (
                  <div className="bg-base-100 p-2 border border-base-content/10">
                    <span className="text-[7px] text-base-content/65 uppercase block">Intelligence Reveals:</span>
                    <div className="flex flex-wrap gap-1 mt-0.5 justify-center">
                      {myRoleInfo.visiblePlayers.map((vp: any, idx: number) => {
                        const targetPlayer = players.find((pl) => pl.userId === vp.userId);
                        return (
                          <span key={idx} className="badge badge-outline rounded-none text-[8px] uppercase py-1 px-1.5">
                            {vp.userId === session.user.id ? "Me" : (targetPlayer?.name ?? `Player ${vp.userId.slice(-4)}`)}: <span className="text-amber-500 font-bold ml-1">{vp.role.replace("_", " ")}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Custom rules, shown in the lobby only */}
          {!playerView && isCustomRoom && (
            <CustomRoomSettings
              roomId={roomId}
              apiUrl={API_URL}
              room={roomData}
              players={players.map((p) => ({ userId: p.userId, name: p.name }))}
              isHost={isHost}
            />
          )}
        </div>

        {/* COLUMN 2: Phase Actions, Logs & Chat Sidebar (4 Columns) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Authoritative Action Panel & Directives */}
          {playerView?.game.phase === "POST_GAME" ? (
            <PostGameSummary
              game={playerView.game}
              playerNames={Object.fromEntries(players.map((p) => [p.userId, p.name]))}
              onReturnToLobby={() => {
                gameAudio.playClick();
                setPlayerView(null);
                setCurrentPhase("LOBBY");
                fetchRoom();
              }}
            />
          ) : playerView ? (
            <>
              <RoleCard
                view={playerView}
                playerNames={Object.fromEntries(players.map((p) => [p.userId, p.name]))}
              />
              <ActionPanel
                view={playerView}
                playerNames={Object.fromEntries(players.map((p) => [p.userId, p.name]))}
                onNominate={handleNominate}
                onCastVote={handleCastVote}
                onPlayCard={handlePlayCard}
                onDeBussyReveal={handleDeBussyReveal}
                onJeanLawLock={handleJeanLawLock}
                onGuess={handleGuess}
                loading={actionLoading}
              />
            </>
          ) : (
            <div className="bg-base-100 border-4 border-base-content/20 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.15)] p-4 pixel-card flex flex-col justify-between min-h-[200px]">
              <div>
                <h3 className="font-pixel text-[10px] text-secondary uppercase border-b-2 border-dashed pb-1.5 mb-2 border-base-content/20">
                  Secretariat Directives
                </h3>
              </div>
              <div className="flex-1 flex flex-col justify-center items-center text-center p-2">
                <p className="text-xs font-sans mb-3 text-base-content/85">
                  Waiting for conspirators. Current player count: {players.length} / 15
                </p>
                {isHost ? (
                  <button
                    onClick={handleStartGame}
                    disabled={players.length < 6 || actionLoading}
                    className="btn btn-sm btn-success rounded-none border-2 font-pixel pixel-btn"
                  >
                    {actionLoading ? "STARTING..." : "START MATCH"}
                  </button>
                ) : (
                  <div className="alert alert-info rounded-none border-2 py-1 px-3 text-[10px] font-pixel text-center">
                    <span>Waiting for Host to begin...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Right Tab Console (Chat vs Log Chronicle) */}
          <div className="bg-base-100 border-4 border-base-content/20 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.15)] p-4 flex flex-col h-[320px] justify-between pixel-card">
            
            {/* Tab Bar */}
            <div className="flex border-b-2 border-base-content/25 mb-3 font-pixel text-[10px]">
              <button 
                onClick={() => { gameAudio.playClick(); setRightSidebarTab("chat"); }}
                className={`flex-1 text-center pb-2 uppercase ${rightSidebarTab === "chat" ? "border-b-4 border-primary text-primary font-bold" : "text-base-content/50"}`}
              >
                Chat Scrolls
              </button>
              <button 
                onClick={() => { gameAudio.playClick(); setRightSidebarTab("chronicle"); }}
                className={`flex-1 text-center pb-2 uppercase ${rightSidebarTab === "chronicle" ? "border-b-4 border-primary text-primary font-bold" : "text-base-content/50"}`}
              >
                Chronicle
              </button>
              <button
                onClick={() => { gameAudio.playClick(); setRightSidebarTab("voice"); }}
                className={`flex-1 text-center pb-2 uppercase ${rightSidebarTab === "voice" ? "border-b-4 border-primary text-primary font-bold" : "text-base-content/50"}`}
              >
                Voice{voice.joined ? (voice.muted ? " 🔇" : " 🎙️") : voice.participants.length > 0 ? ` (${voice.participants.length})` : ""}
              </button>
            </div>

            {/* Render Tab Contents */}
            {rightSidebarTab === "voice" ? (
              <VoiceChatPanel
                voice={voice}
                playerNames={Object.fromEntries(players.map((p) => [p.userId, p.name]))}
              />
            ) : rightSidebarTab === "chat" ? (
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 mb-2">
                  {messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center opacity-50 font-pixel">
                      <span className="text-[9px]">No logs dispatched yet.</span>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isOwn = msg.userId === session.user.id;
                      return (
                        <div key={msg.id} className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                          <span className="text-[8px] font-pixel font-bold text-base-content/60 mb-0.5">{msg.username}</span>
                          <div className={`px-2.5 py-1 rounded-none text-xs break-words max-w-[85%] border font-mono ${
                            isOwn 
                              ? "bg-primary text-primary-content border-primary" 
                              : "bg-base-200 text-base-content border-base-300"
                          }`}>
                            {msg.text}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-dashed border-base-content/20">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Dispatch scroll..."
                    className="input input-bordered flex-1 text-xs font-pixel bg-base-200 rounded-none border border-base-content/20 p-1.5"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="btn btn-primary btn-xs rounded-none border font-pixel"
                  >
                    SEND
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto font-retro text-xs space-y-1.5 pr-1 leading-relaxed">
                {playerView ? (
                  <NominationHistoryCard
                    nominations={playerView.game.nominations}
                    players={playerView.game.players}
                    playerNames={Object.fromEntries(players.map((p) => [p.userId, p.name]))}
                  />
                ) : voteLogs.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center opacity-50 font-pixel">
                    <span className="text-[9px]">No historical decisions recorded.</span>
                  </div>
                ) : (
                  voteLogs.map((log, idx) => (
                    <div key={idx} className="flex justify-between items-center text-base-content/90 border-b border-base-content/5 pb-1">
                      <span>
                        📜 Round {log.round}: {log.type === "approval" ? "Board Propose" : "Resolution Complete"}
                      </span>
                      <span className={`font-bold uppercase ${log.approved || log.winner === "green" ? "text-emerald-500" : "text-rose-500"}`}>
                        {log.type === "approval" ? (log.approved ? "APPROVED" : "REJECTED") : `WIN: ${log.winner}`}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Character codex modal */}
      {showInfoModal && (
        <InfoModal
          open={showInfoModal}
          onClose={() => { gameAudio.playClick(); setShowInfoModal(false); }}
          roles={activeRolesFilter.map((r) => ({ name: r.name, team: r.team, power: r.power }))}
        />
      )}
    </main>
  );
}
