"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { authClient } from "@/lib/auth-client";

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
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

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

  // Theme selector state
  const [currentTheme, setCurrentTheme] = useState("retro");

  // Game States
  const [roomData, setRoomData] = useState<any>(null);
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [myRoleInfo, setMyRoleInfo] = useState<any>(null);
  const [currentPhase, setCurrentPhase] = useState<string>("LOBBY"); // LOBBY, DISCUSSION, TEAM_PROPOSAL, TEAM_APPROVAL, MISSION_VOTE, ENDGAME
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
  }, []);

  const changeTheme = (themeName: string) => {
    setCurrentTheme(themeName);
    localStorage.setItem("daisyui-theme", themeName);
    document.documentElement.setAttribute("data-theme", themeName);
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

  // Socket Connections (Runs exactly once on mount, depends only on roomId and session)
  useEffect(() => {
    if (!session) return;

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.emit("user:identify", { userId: session.user.id });

    socket.emit("room:join", { roomId, userId: session.user.id });

    socket.on("chat:history", (history: ChatMessage[]) => {
      setMessages(history);
    });

    socket.on("chat:message", (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("game:join", () => {
      fetchRoom();
    });

    socket.on("game:leave", () => {
      fetchRoom();
    });

    socket.on("room:online-list", (userIds: string[]) => {
      const initialOnline: Record<string, boolean> = {};
      userIds.forEach((id) => {
        initialOnline[id] = true;
      });
      setOnlinePlayers(initialOnline);
    });

    socket.on("player:status", ({ userId, online }: { userId: string; online: boolean }) => {
      setOnlinePlayers((prev) => ({ ...prev, [userId]: online }));
    });

    socket.on("game:started", () => {
      setCurrentPhase("DISCUSSION");
      setSelectedPlayers([]);
      setHasVotedApproval(false);
      setHasVotedMission(false);
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
      } else {
        setCurrentPhase("DISCUSSION");
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
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId, session]);

  // Discussion countdown timer
  useEffect(() => {
    if (currentPhase !== "DISCUSSION" || discussionTimer <= 0) return;
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

  const handleStartGame = () => {
    if (socketRef.current) {
      socketRef.current.emit("game:start", { roomId, hostUserId: session?.user.id });
    }
  };

  const handleProposeTeam = () => {
    if (socketRef.current) {
      socketRef.current.emit("round:proposeTeam", {
        roomId,
        selectorId: session?.user.id,
        playerIds: selectedPlayers,
      });
    }
  };

  const handleVoteApproval = (vote: "approve" | "reject") => {
    if (socketRef.current) {
      socketRef.current.emit("round:approvalVote", {
        roomId,
        userId: session?.user.id,
        vote,
      });
      setHasVotedApproval(true);
    }
  };

  const handleVoteMission = (vote: "green" | "red") => {
    if (socketRef.current) {
      socketRef.current.emit("round:missionVote", {
        roomId,
        userId: session?.user.id,
        vote,
      });
      setHasVotedMission(true);
    }
  };

  const handleMirJafarGuessSubmit = (targetUserId: string) => {
    if (socketRef.current) {
      socketRef.current.emit("endgame:guess", {
        roomId,
        userId: session?.user.id,
        targetUserId,
        guessType: "role",
      });
      setMirJafarGuessActive(false);
    }
  };

  const handleJagatSethGuessSubmit = (targetUserId: string) => {
    if (socketRef.current) {
      socketRef.current.emit("endgame:guess", {
        roomId,
        userId: session?.user.id,
        targetUserId,
        guessType: "role",
      });
      setJagatSethGuessActive(false);
    }
  };

  const handleDeBussyScan = (targetUserId: string) => {
    if (socketRef.current) {
      socketRef.current.emit("debussy:lockOn", {
        roomId,
        userId: session?.user.id,
        targetUserId,
      });
    }
  };

  const handleJeanLawCurse = (targetUserId: string) => {
    if (socketRef.current) {
      socketRef.current.emit("jeanlaw:lock", {
        roomId,
        userId: session?.user.id,
        targetUserId,
      });
    }
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
    if (!session?.user) return;
    try {
      await fetch(`${API_URL}/rooms/${roomId}/leave`, {
        method: "POST",
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

  const isHost = roomData?.hostUserId === session?.user.id;
  const isMyTurnToSelect = currentSelectorId === session?.user.id || (roomData?.hostUserId === session?.user.id && currentSelectorId === "");
  const sizeToSelect = getTeamSizeForRound(roundNumber, players.length);

  if (isPending || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-200">
        <div className="text-center font-sans">
          <span className="loading loading-spinner loading-lg text-primary mb-4"></span>
          <p className="text-lg font-bold">Unrolling old scrolls...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-base-200 text-base-content font-sans p-4 md:p-6 flex flex-col items-center">
      
      {/* Decorative Navbar */}
      <div className="navbar bg-base-100 border border-base-300 shadow-md rounded-box w-full max-w-6xl px-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1">
          <span className="font-serif text-2xl font-extrabold tracking-wide uppercase text-primary">Battle of Plassey 1757</span>
        </div>

        <div className="flex-none flex items-center gap-3">
          <span className="bg-neutral text-neutral-content px-3 py-1.5 rounded-lg text-xs font-semibold uppercase">
            Room Code: {roomData?.code ?? roomId.slice(0, 6)}
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
            onClick={() => setShowInfoModal(true)}
            className="btn btn-primary btn-sm"
          >
            Role Abilities Reference
          </button>

          <button
            onClick={handleLeaveRoom}
            className="btn btn-error btn-sm"
          >
            Leave Room
          </button>
        </div>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
        
        {/* LEFT COLUMN: Main Game Area (8 Columns) */}
        <div className="lg:col-span-8 flex flex-col gap-6 h-full">
          
          {/* Main Gameplay Screen Card */}
          <div className="card bg-base-100 border border-base-300 shadow-xl p-6 relative overflow-hidden flex-1 flex flex-col min-h-[450px]">
            
            {/* Header Phase and Timer */}
            <div className="flex justify-between items-center border-b border-base-300 pb-4 mb-4">
              <div>
                <h2 className="text-2xl font-serif font-extrabold text-primary uppercase tracking-wide">
                  Phase: {currentPhase.replace("_", " ")}
                </h2>
                <p className="text-sm font-bold text-secondary">
                  Round {roundNumber} / 5 • Proposed Board Size: {sizeToSelect}
                </p>
              </div>

              {currentPhase === "DISCUSSION" && (
                <div className="flex items-center gap-2 bg-warning/20 border border-warning px-4 py-2 rounded-xl text-warning-content">
                  <span className="text-xs font-bold uppercase">Timer:</span>
                  <span className="text-2xl font-mono font-bold">{discussionTimer}s</span>
                </div>
              )}
            </div>

            {/* Roles in Play Reference list */}
            {rolesInPlay.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4 items-center bg-base-200 border border-base-300 p-2.5 rounded-xl">
                <span className="text-[10px] font-bold uppercase text-secondary font-sans tracking-wide">Roles in Play:</span>
                {rolesInPlay.map((role) => (
                  <span key={role} className="badge badge-sm badge-neutral font-mono font-bold uppercase py-2">
                    {role.replace("_", " ")}
                  </span>
                ))}
              </div>
            )}

            {/* Content view based on active phase */}
            <div className="flex-1 flex flex-col justify-between">
              
              {/* LOBBY PHASE */}
              {currentPhase === "LOBBY" && (
                <div className="text-center py-12 flex-1 flex flex-col justify-center items-center gap-6">
                  <h3 className="text-2xl font-serif font-extrabold text-primary">Gathering Ministers in the Nawab's Tent</h3>
                  <p className="text-sm text-base-content/80 max-w-md">
                    We currently have <span className="font-bold text-secondary">{players.length}</span> players out of the required 6 to 15. The game can begin once everyone has arrived.
                  </p>

                  {isHost ? (
                    <button
                      onClick={handleStartGame}
                      disabled={players.length < 6}
                      className="btn btn-success btn-lg"
                    >
                      Start Social Deduction (Min 6 players)
                    </button>
                  ) : (
                    <div className="alert alert-info max-w-xs font-bold text-center">
                      <span>Waiting for Host to start...</span>
                    </div>
                  )}
                </div>
              )}

              {/* ACTIVE RUNNING GAMESTATE */}
              {currentPhase !== "LOBBY" && currentPhase !== "ENDGAME" && (
                <div className="flex-1 flex flex-col justify-between gap-6">
                  
                  {/* Private Role HUD Card */}
                  {myRoleInfo && (
                    <div className="card bg-base-200 border border-base-300 p-4 rounded-xl shadow-inner flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <span className="text-xs uppercase font-bold tracking-wider text-base-content/65">Your Secretariat Role:</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xl font-serif font-extrabold uppercase text-primary">{myRoleInfo.role.replace("_", " ")}</span>
                          <span className={`badge badge-sm font-bold uppercase ${
                            myRoleInfo.team === "green" ? "badge-success" :
                            myRoleInfo.team === "red" ? "badge-error" : "badge-warning"
                          }`}>
                            Team {myRoleInfo.team}
                          </span>
                        </div>
                      </div>

                      {/* Vision / Mask reveal tags */}
                      {myRoleInfo.visiblePlayers && myRoleInfo.visiblePlayers.length > 0 && (
                        <div className="card bg-base-100 p-3 rounded-lg border border-base-300 w-full md:w-auto">
                          <span className="text-[10px] uppercase font-bold text-base-content/65">Vision / Secret Intelligence:</span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {myRoleInfo.visiblePlayers.map((vp: any, idx: number) => {
                              const targetPlayer = players.find(p => p.userId === vp.userId);
                              return (
                                <span key={idx} className="badge badge-outline badge-secondary text-xs font-bold">
                                  {vp.userId === session.user.id ? "Me" : (targetPlayer?.name ?? `Player ${vp.userId.slice(-4)}`)}: <span className="uppercase font-bold ml-1">{vp.role.replace("_", " ")}</span>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* PROPOSAL SELECTION FORM */}
                  {currentPhase === "TEAM_PROPOSAL" && (
                    <div className="flex-1 flex flex-col justify-center items-center py-6 gap-4">
                      {isMyTurnToSelect ? (
                        <>
                          <h3 className="text-xl font-bold text-center">
                            You are the Minister Board Leader. Select {sizeToSelect} players for the mission.
                          </h3>
                          <div className="flex flex-wrap justify-center gap-2 max-w-lg mt-2">
                            {players.map((p) => {
                              const isSelected = selectedPlayers.includes(p.userId);
                              return (
                                <button
                                  key={p.userId}
                                  onClick={() => {
                                    if (isSelected) {
                                      setSelectedPlayers(selectedPlayers.filter((id) => id !== p.userId));
                                    } else {
                                      if (selectedPlayers.length < sizeToSelect) {
                                        setSelectedPlayers([...selectedPlayers, p.userId]);
                                      }
                                    }
                                  }}
                                  className={`btn btn-sm ${isSelected ? "btn-primary" : "btn-outline"}`}
                                >
                                  {p.userId === session.user.id ? "Me" : p.name}
                                </button>
                              );
                            })}
                          </div>

                          <button
                            onClick={handleProposeTeam}
                            disabled={selectedPlayers.length !== sizeToSelect}
                            className="btn btn-secondary mt-4 shadow-md"
                          >
                            Propose Minister Board
                          </button>
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <span className="loading loading-spinner loading-md text-primary mb-4"></span>
                          <h3 className="text-lg font-bold">
                            Leader ({players.find(p => p.userId === currentSelectorId)?.name || `Player ${currentSelectorId.slice(-4)}`}) is selecting {sizeToSelect} ministers...
                          </h3>
                        </div>
                      )}
                    </div>
                  )}

                  {/* APPROVAL VOTING STATE PANEL */}
                  {currentPhase === "TEAM_APPROVAL" && (
                    <div className="flex-1 flex flex-col justify-center items-center py-6 gap-4 text-center">
                      <h3 className="text-xl font-bold">Do you support this Proposed Minister Board?</h3>
                      
                      <div className="card bg-base-200 border border-base-300 px-6 py-4 rounded-xl max-w-md my-2">
                        <span className="text-xs uppercase font-bold text-secondary">Proposed Ministers:</span>
                        <div className="flex flex-wrap justify-center gap-2 mt-2">
                          {proposedTeam.map((id) => (
                            <span key={id} className="badge badge-accent py-2.5 font-bold text-sm">
                              {players.find(p => p.userId === id)?.name || `Player ${id.slice(-4)}`}
                            </span>
                          ))}
                        </div>
                      </div>

                      {!hasVotedApproval ? (
                        <div className="flex gap-4 mt-2">
                          <button
                            onClick={() => handleVoteApproval("approve")}
                            className="btn btn-success"
                          >
                            Approve Board
                          </button>
                          <button
                            onClick={() => handleVoteApproval("reject")}
                            className="btn btn-error"
                          >
                            Reject Board
                          </button>
                        </div>
                      ) : (
                        <div className="alert alert-info max-w-xs font-bold">
                          <span>Your vote has been cast. Waiting for others...</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* RESOLUTION SECRET VOTE RESOLUTION PANEL */}
                  {currentPhase === "MISSION_VOTE" && (
                    <div className="flex-1 flex flex-col justify-center items-center py-6 gap-4 text-center">
                      <h3 className="text-xl font-bold">Minister Resolution Phase</h3>
                      <p className="text-sm text-base-content/85 max-w-sm">
                        The board has been approved. If you are a member of the board, cast your secret vote. Traitors (Red team) can vote RED to sabotage.
                      </p>

                      {proposedTeam.includes(session.user.id) ? (
                        !hasVotedMission ? (
                          <div className="flex gap-4 mt-2">
                            <button
                              onClick={() => handleVoteMission("green")}
                              className="btn btn-success"
                            >
                              Vote GREEN (Loyalty)
                            </button>
                            <button
                              onClick={() => handleVoteMission("red")}
                              className="btn btn-error"
                            >
                              Vote RED (Sabotage)
                            </button>
                          </div>
                        ) : (
                          <div className="alert alert-info max-w-xs font-bold">
                            <span>Secret vote cast. Waiting for others...</span>
                          </div>
                        )
                      ) : (
                        <div className="alert alert-neutral max-w-xs font-bold">
                          <span>You are not on the board. Ministers are voting...</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* CHARACTER SPECIFIC POWER TOGGLES */}
                  <div className="border-t border-base-300 pt-4 mt-2">
                    <h4 className="text-xs uppercase font-bold tracking-wider text-base-content/60 mb-2">Special Character Actions:</h4>
                    
                    {myRoleInfo?.role === "de_bussy" && !deBussyScanned && (
                      <div className="card bg-base-200 border border-base-300 p-3 rounded-lg flex flex-col gap-2">
                        <span className="text-sm font-semibold text-primary">De Bussy Scan (Once Per Game):</span>
                        <div className="flex flex-wrap gap-2">
                          {players
                            .filter((p) => p.userId !== session.user.id)
                            .map((p) => (
                              <button
                                key={p.userId}
                                onClick={() => handleDeBussyScan(p.userId)}
                                className="btn btn-xs btn-secondary"
                              >
                                Scan {p.name}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                    {deBussyScanned && (
                      <div className="alert alert-success text-sm font-bold">
                        <span>Scan Result: Player {players.find(p => p.userId === deBussyScanned.targetUserId)?.name || deBussyScanned.targetUserId.slice(-4)} role is: <span className="uppercase underline ml-1">{deBussyScanned.role?.replace("_", " ") ?? "Unknown"}</span></span>
                      </div>
                    )}

                    {myRoleInfo?.role === "jean_law" && !jeanLawConfirmed && (
                      <div className="card bg-base-200 border border-base-300 p-3 rounded-lg mt-2 flex flex-col gap-2">
                        <span className="text-sm font-semibold text-primary">Jean Law Lock/Curse (Once Per Game):</span>
                        <div className="flex flex-wrap gap-2">
                          {players
                            .filter((p) => p.userId !== session.user.id)
                            .map((p) => (
                              <button
                                key={p.userId}
                                onClick={() => handleJeanLawCurse(p.userId)}
                                className="btn btn-xs btn-error"
                              >
                                Curse {p.name}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                    {jeanLawConfirmed && (
                      <div className="alert alert-warning text-sm font-bold mt-2">
                        <span>Lock Confirmed: You locked onto {players.find(p => p.userId === jeanLawConfirmed)?.name || jeanLawConfirmed.slice(-4)}.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* GAME END RESULT VIEW */}
              {currentPhase === "ENDGAME" && (
                <div className="text-center py-6 flex-1 flex flex-col justify-center items-center gap-4">
                  <h3 className="text-3xl font-serif font-extrabold uppercase tracking-wide text-primary">
                    Victory: {finalWinner} Team
                  </h3>

                  {mirJafarGuessActive && myRoleInfo?.role === "mir_jafar" && (
                    <div className="card bg-base-200 border border-base-300 p-5 rounded-2xl max-w-lg shadow-md my-2">
                      <h4 className="text-lg font-bold text-error">Mir Jafar Guess Phase</h4>
                      <p className="text-xs text-base-content/85 mb-4">
                        Green team won the rounds, but you get one guess. Identify Mir Madan to steal victory for Red!
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {players
                          .filter((p) => p.userId !== session.user.id)
                          .map((p) => (
                            <button
                              key={p.userId}
                              onClick={() => handleMirJafarGuessSubmit(p.userId)}
                              className="btn btn-sm btn-error"
                            >
                              {p.name} is Mir Madan
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                  {jagatSethGuessActive && myRoleInfo?.role === "jagat_seth" && (
                    <div className="card bg-base-200 border border-base-300 p-5 rounded-2xl max-w-lg shadow-md my-2">
                      <h4 className="text-lg font-bold text-warning">Jagat Seth Chaos Guess Phase</h4>
                      <p className="text-xs text-base-content/85 mb-4">
                        {jagatSethTargetTeam === "RED" 
                          ? "Red team is currently winning. Find Rai Durlabh to win alone!" 
                          : "Green team is currently winning. Find Mir Jafar to win alone!"}
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {players
                          .filter((p) => p.userId !== session.user.id)
                          .map((p) => (
                            <button
                              key={p.userId}
                              onClick={() => handleJagatSethGuessSubmit(p.userId)}
                              className="btn btn-sm btn-warning"
                            >
                              {p.name}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Secretariat reveal lists */}
                  <div className="w-full max-w-md bg-base-200 border border-base-300 rounded-xl p-4 shadow-sm text-left mt-2">
                    <h4 className="font-serif font-bold text-sm uppercase text-primary mb-3 pb-1.5 border-b border-base-300">Secret Secretariat Reveals:</h4>
                    <div className="space-y-2">
                      {roleReveal.map((reveal) => {
                        const isHumiliated = reveal.team === "humiliated" || excludedWinCredit.includes(reveal.userId);
                        const playerInfo = players.find(p => p.userId === reveal.userId);
                        return (
                          <div key={reveal.userId} className="flex justify-between items-center text-sm">
                            <span className="font-sans font-semibold">
                              {playerInfo?.name || `Player ${reveal.userId.slice(-4)}`} {reveal.userId === session.user.id && "(Me)"}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="badge badge-neutral text-xs font-mono uppercase">
                                {reveal.role.replace("_", " ")}
                              </span>
                              <span className={`badge badge-sm font-bold uppercase ${
                                reveal.team === "green" ? "badge-success text-success-content" :
                                reveal.team === "red" ? "badge-error text-error-content" :
                                reveal.team === "gold" ? "badge-warning text-warning-content" : "badge-neutral"
                              }`}>
                                {reveal.team}
                              </span>
                              {isHumiliated && (
                                <span className="badge badge-sm badge-accent animate-pulse font-bold">
                                  Humiliated
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Historical Round log cards */}
          {voteLogs.length > 0 && (
            <div className="card bg-base-100 border border-base-300 shadow-md p-4 font-sans text-xs">
              <h4 className="font-bold text-xs uppercase tracking-wider text-secondary mb-2 pb-1 border-b border-base-200">Historical Chronology:</h4>
              <div className="space-y-1">
                {voteLogs.map((log, idx) => (
                  <div key={idx} className="flex justify-between items-center text-base-content/85">
                    <span>
                      Round {log.round} {log.type === "approval" ? "Minister Board selection" : "Resolution Resolution"}
                    </span>
                    <span className={`font-bold ${log.approved || log.winner === "GREEN" ? "text-success" : "text-error"}`}>
                      {log.type === "approval" ? (log.approved ? "APPROVED" : "REJECTED") : `WINNER: ${log.winner}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Chat and Players List (4 Columns) */}
        <div className="lg:col-span-4 flex flex-col gap-6 h-full lg:sticky lg:top-6">
          
          {/* Players in Room Card */}
          <div className="card bg-base-100 border border-base-300 shadow-md p-4">
            <h3 className="text-lg font-serif font-bold text-primary border-b pb-2 mb-3 border-base-300">Players ({players.length})</h3>
            <div className="space-y-2">
              {players.map((p) => {
                const isOnline = onlinePlayers[p.userId] !== false; // Default to online
                return (
                  <div key={p.userId} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-success" : "bg-neutral opacity-60"}`} />
                      <span className={`font-sans font-semibold text-sm ${!isOnline && "opacity-50"}`}>
                        {p.name} {p.userId === session.user.id && "(Me)"}
                      </span>
                      {!isOnline && (
                        <span className="text-[9px] uppercase font-bold text-neutral-content bg-neutral/40 px-1 rounded">Offline</span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {p.isHost && (
                        <span className="badge badge-sm badge-neutral font-bold uppercase text-[9px]">
                          Host
                        </span>
                      )}
                      {currentSelectorId === p.userId && (
                        <span className="badge badge-sm badge-secondary font-bold uppercase text-[9px] animate-pulse">
                          Leader
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chat Interface Card */}
          <div className="card bg-base-100 border border-base-300 shadow-md p-4 flex flex-col h-[380px] justify-between">
            <h3 className="text-lg font-serif font-bold text-primary border-b pb-2 mb-3 border-base-300">Secretariat Chat</h3>
            
            {/* Scrollable messages */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-2 mb-3">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center opacity-50">
                  <p className="text-xs font-sans">No messages yet. Send a warning message to the ministers...</p>
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
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="flex gap-2 pt-3 border-t border-base-300">
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

      {/* ROLES INFO MODAL using DaisyUI */}
      {showInfoModal && (
        <div className="modal modal-open z-50">
          <div className="modal-box max-w-2xl max-h-[85vh] flex flex-col p-0 border border-base-300 shadow-2xl bg-base-100 rounded-2xl">
            <div className="p-4 bg-primary text-primary-content flex justify-between items-center">
              <h3 className="text-xl font-serif font-bold uppercase tracking-wide">Historical Character secret abilities</h3>
              <button
                onClick={() => setShowInfoModal(false)}
                className="btn btn-ghost btn-sm text-xl font-bold"
              >
                x
              </button>
            </div>
            
            <div className="overflow-y-auto p-6 space-y-4">
              <p className="text-sm text-base-content/85 font-sans mb-4">
                The Battle of Plassey (1757) splits players into two factions: the **Green Team** (Nawab Siraj's loyalists) and the **Red Team** (British East India conspirators), with **Jagat Seth** acting as a Gold Team wildcard.
              </p>

              <div className="space-y-3">
                {CHARACTER_ROLES.map((role) => (
                  <div key={role.name} className="border-b border-base-300 pb-3 flex flex-col md:flex-row md:items-center gap-2">
                    <div className="md:w-1/3 flex items-center gap-2">
                      <span className="font-bold text-primary font-serif">{role.name}</span>
                      <span className={`badge badge-sm font-bold uppercase ${
                        role.team === "Green" ? "badge-success text-success-content" :
                        role.team === "Red" ? "badge-error text-error-content" : "badge-warning text-warning-content"
                      }`}>
                        {role.team}
                      </span>
                    </div>
                    <p className="md:w-2/3 text-xs text-base-content/80 font-sans">{role.power}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-base-200 border-t border-base-300 flex justify-end">
              <button
                onClick={() => setShowInfoModal(false)}
                className="btn btn-primary btn-sm"
              >
                Close Reference
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
