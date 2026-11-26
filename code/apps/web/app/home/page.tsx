"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { gameAudio } from "@/lib/audio";
import { MusicControl } from "@/components/MusicControl";

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

export default function HomePage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const [currentTheme, setCurrentTheme] = useState("retro");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [userStats, setUserStats] = useState<{
    xp: number;
    level: number;
    matchesPlayed: number;
    matchesWon: number;
    winRate: number;
  } | null>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [roomMode, setRoomMode] = useState<"STANDARD" | "CUSTOM">("STANDARD");
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("daisyui-theme") || "retro";
    setCurrentTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
    setSoundEnabled(gameAudio.isEnabled());
  }, []);

  useEffect(() => {
    if (session?.user) {
      setDisplayName(session.user.name);
      // Fetch extended profile & stats
      fetch(`${API_URL}/api/users/me`, { credentials: "include" })
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (json?.data) {
            if (json.data.username) setUsername(json.data.username);
          }
        })
        .catch(() => {});

      fetch(`${API_URL}/api/users/me/stats`, { credentials: "include" })
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (json?.data) setUserStats(json.data);
        })
        .catch(() => {});
    }
  }, [session]);

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

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/login");
    }
  }, [isPending, session, router]);

  async function handleSignOut() {
    gameAudio.playClick();
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    gameAudio.playClick();
    if (!displayName.trim() || !session?.user) return;
    setProfileMessage(null);
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/users/me`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: displayName.trim(),
          ...(username.trim() ? { username: username.trim() } : {}),
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error ?? "Failed to update profile");
      }

      await authClient.getSession({ fetchOptions: { cache: "no-store" } });
      setProfileMessage("Profile updated successfully");
    } catch (err) {
      setProfileMessage(err instanceof Error ? err.message : "Error updating profile");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    gameAudio.playClick();
    if (!session?.user) return;
    setError(null);
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/rooms`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maxPlayers,
          mode: roomMode,
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
    gameAudio.playClick();
    const codeOrId = joinCode.trim();
    if (!codeOrId || !session?.user) return;
    setError(null);
    setActionLoading(true);
    try {
      let roomId = "";

      if (codeOrId.length === 6) {
        const res = await fetch(`${API_URL}/rooms/code/${codeOrId.toUpperCase()}`);
        if (!res.ok) {
          throw new Error("Invalid room code or room not found");
        }
        const data = await res.json();
        roomId = data.roomId;
      } else {
        const res = await fetch(`${API_URL}/rooms/${codeOrId}`);
        if (!res.ok) {
          throw new Error("Invalid room ID or room not found");
        }
        const data = await res.json();
        roomId = data.id;
      }
      
      const joinRes = await fetch(`${API_URL}/rooms/${roomId}/join`, {
        method: "POST",
        credentials: "include",
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

  if (isPending || !session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0B0A08] text-[#C8A252]">
        <div className="text-center space-y-3">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#C8A252]/30 border-t-[#C8A252]" />
          <p className="font-display text-xl tracking-[0.2em] uppercase text-[#F2ECE1]/80">
            Convening the Council...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-[#0B0A08] candlelight-bg text-[#F2ECE1] px-4 py-6 md:px-8 md:py-8 flex flex-col items-center">
      <div aria-hidden className="grain-overlay" />

      {/* Top Navigation Bar */}
      <header className="relative z-10 w-full max-w-6xl mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl council-panel px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#C8A252]/40 bg-[#C8A252]/10 font-display text-lg font-bold text-[#C8A252]">
            17
          </div>
          <div>
            <span className="font-display text-xl md:text-2xl font-bold tracking-wide text-[#F2ECE1]">
              Battle of Plassey
            </span>
            <span className="hidden sm:inline-block ml-2.5 text-[11px] font-mono-code uppercase tracking-[0.2em] text-[#C8A252]/80">
              1757 · Secretariat
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <button
            onClick={toggleSound}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
              soundEnabled
                ? "border-[#C8A252]/50 bg-[#C8A252]/15 text-[#F2ECE1]"
                : "border-white/10 bg-white/5 text-[#9E9587] hover:text-[#F2ECE1]"
            }`}
          >
            {soundEnabled ? "SFX On" : "SFX Off"}
          </button>

          <MusicControl />

          <div className="hidden md:flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-[#F2ECE1]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>{session.user.name}</span>
          </div>

          {/* Theme Dropdown */}
          <div className="dropdown dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 bg-white/5 text-[#9E9587] hover:text-[#F2ECE1] hover:border-white/20 transition-all cursor-pointer capitalize"
            >
              {currentTheme}
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content menu bg-[#161410] rounded-xl z-20 w-48 p-1.5 shadow-2xl border border-[#C8A252]/25 max-h-60 overflow-y-auto mt-2"
            >
              {THEMES.map((themeName) => (
                <li key={themeName}>
                  <button
                    onClick={() => changeTheme(themeName)}
                    className="capitalize text-xs text-[#F2ECE1]/85 hover:bg-[#C8A252]/15 hover:text-[#C8A252] rounded-lg"
                  >
                    {themeName}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={handleSignOut}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 transition-all cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-stretch">
        {/* LEFT COLUMN: Controls Dashboard (7 Columns) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <section className="council-panel rounded-2xl p-6 md:p-7 flex flex-col gap-6 flex-1 justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#C8A252]/20 pb-3 mb-3">
                <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-wide text-[#F2ECE1]">
                  Lobby Secretary
                </h2>
                <span className="text-[10px] font-mono-code uppercase tracking-[0.2em] text-[#C8A252]">
                  War Room
                </span>
              </div>
              <p className="text-sm leading-relaxed text-[#9E9587]">
                Welcome, commander. Initialize a new secretariat chamber or enter an active council session using a 6-character registry code.
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-xs text-red-200">
                {error}
              </div>
            )}

            {/* Action 1: Create a Room */}
            <div className="council-panel-subtle rounded-xl p-5 space-y-4">
              <div>
                <h3 className="font-display text-xl font-semibold text-[#F2ECE1]">
                  Create Chamber
                </h3>
                <p className="text-xs text-[#9E9587] mt-0.5">
                  Configure ruleset and seat capacity (6–15 players).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Room mode">
                {([
                  {
                    mode: "STANDARD",
                    title: "Standard Council",
                    blurb: "Classic Plassey rules: all characters in play, random deal, fixed timers.",
                  },
                  {
                    mode: "CUSTOM",
                    title: "Royal Decree",
                    blurb: "Custom rules: per-round timers, character selection, host-assigned roles & pause.",
                  },
                ] as const).map((option) => {
                  const selected = roomMode === option.mode;
                  return (
                    <button
                      key={option.mode}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => {
                        gameAudio.playClick();
                        setRoomMode(option.mode);
                      }}
                      className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                        selected
                          ? "border-[#C8A252] bg-[#C8A252]/10 shadow-[0_0_20px_-6px_rgba(200,162,82,0.35)]"
                          : "border-white/10 bg-white/[0.02] hover:border-white/25"
                      }`}
                    >
                      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#F2ECE1]">
                        <span
                          className={`h-2.5 w-2.5 rounded-full border transition-colors ${
                            selected ? "bg-[#C8A252] border-[#C8A252]" : "border-white/40"
                          }`}
                        />
                        {option.title}
                      </span>
                      <span className="block text-xs text-[#9E9587] mt-1.5 leading-relaxed">
                        {option.blurb}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 pt-1">
                <div className="flex-1">
                  <label className="block text-[11px] font-mono-code uppercase tracking-wider text-[#9E9587] mb-1.5">
                    Max Capacity (6–15)
                  </label>
                  <input
                    type="number"
                    min={6}
                    max={15}
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(parseInt(e.target.value, 10))}
                    className="w-full rounded-xl border border-white/15 bg-[#0B0A08]/80 px-3.5 py-2.5 text-sm font-mono-code text-[#F2ECE1] focus:border-[#C8A252] focus:outline-none focus:ring-1 focus:ring-[#C8A252]/40"
                  />
                </div>

                <button
                  onClick={handleCreateRoom}
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#C8A252] text-[#0B0A08] font-semibold text-xs uppercase tracking-wider hover:bg-[#D6B366] active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-[#C8A252]/15"
                >
                  {actionLoading ? "Creating..." : roomMode === "CUSTOM" ? "New Royal Decree" : "New Chamber"}
                </button>
              </div>
            </div>

            {/* Action 2: Join by Room Code */}
            <form onSubmit={handleJoinRoomByCode} className="council-panel-subtle rounded-xl p-5 space-y-4">
              <div>
                <h3 className="font-display text-xl font-semibold text-[#F2ECE1]">
                  Enter Chamber
                </h3>
                <p className="text-xs text-[#9E9587] mt-0.5">
                  Enter the 6-character registry code or paste a room ID.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] font-mono-code uppercase tracking-wider text-[#9E9587] mb-1.5">
                    Registry Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. A1B2C3"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    required
                    className="w-full rounded-xl border border-white/15 bg-[#0B0A08]/80 px-3.5 py-2.5 text-sm font-mono-code uppercase tracking-widest text-[#F2ECE1] placeholder:text-[#9E9587]/40 focus:border-[#C8A252] focus:outline-none focus:ring-1 focus:ring-[#C8A252]/40"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading || !joinCode.trim()}
                  className="px-5 py-2.5 rounded-xl border border-[#C8A252]/50 bg-[#C8A252]/15 text-[#F2ECE1] font-semibold text-xs uppercase tracking-wider hover:bg-[#C8A252]/25 active:scale-[0.98] disabled:opacity-40 transition-all cursor-pointer"
                >
                  {actionLoading ? "Joining..." : "Join Chamber"}
                </button>
              </div>
            </form>
          </section>
        </div>

        {/* RIGHT COLUMN: Profile Settings & Stats (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <section className="council-panel rounded-2xl p-6 md:p-7 flex flex-col justify-between flex-1">
            <div>
              <div className="flex items-center justify-between border-b border-[#C8A252]/20 pb-3 mb-3">
                <h3 className="font-display text-2xl font-semibold text-[#F2ECE1]">
                  Dossier &amp; Profile
                </h3>
                <span className="text-[10px] font-mono-code uppercase tracking-[0.2em] text-[#9E9587]">
                  Courtier
                </span>
              </div>
              <p className="text-xs text-[#9E9587] mb-5 leading-relaxed">
                Customize your display name and unique conspirator handle.
              </p>

              {userStats && (
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="council-panel-subtle rounded-xl p-3.5">
                    <span className="text-[10px] font-mono-code uppercase tracking-wider text-[#9E9587] block">
                      Level
                    </span>
                    <span className="font-display text-2xl font-bold text-[#C8A252]">
                      {userStats.level}
                    </span>
                  </div>
                  <div className="council-panel-subtle rounded-xl p-3.5">
                    <span className="text-[10px] font-mono-code uppercase tracking-wider text-[#9E9587] block">
                      Total XP
                    </span>
                    <span className="font-display text-2xl font-bold text-[#F2ECE1]">
                      {userStats.xp}
                    </span>
                  </div>
                  <div className="council-panel-subtle rounded-xl p-3.5">
                    <span className="text-[10px] font-mono-code uppercase tracking-wider text-[#9E9587] block">
                      Matches
                    </span>
                    <span className="text-sm font-semibold text-[#F2ECE1] mt-1 block">
                      {userStats.matchesPlayed}{" "}
                      <span className="text-emerald-400 text-xs font-mono-code">
                        ({userStats.matchesWon}W)
                      </span>
                    </span>
                  </div>
                  <div className="council-panel-subtle rounded-xl p-3.5">
                    <span className="text-[10px] font-mono-code uppercase tracking-wider text-[#9E9587] block">
                      Win Rate
                    </span>
                    <span className="font-display text-2xl font-bold text-emerald-400">
                      {userStats.winRate}%
                    </span>
                  </div>
                </div>
              )}

              {profileMessage && (
                <div className="rounded-xl border border-[#C8A252]/40 bg-[#C8A252]/10 px-4 py-2.5 text-xs text-[#F2ECE1] mb-4">
                  {profileMessage}
                </div>
              )}
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono-code uppercase tracking-wider text-[#9E9587] mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-[#0B0A08]/80 px-3.5 py-2.5 text-sm text-[#F2ECE1] focus:border-[#C8A252] focus:outline-none focus:ring-1 focus:ring-[#C8A252]/40"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono-code uppercase tracking-wider text-[#9E9587] mb-1.5">
                  Handle / Username
                </label>
                <input
                  type="text"
                  placeholder="e.g. siraj1757"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-[#0B0A08]/80 px-3.5 py-2.5 text-sm font-mono-code text-[#F2ECE1] placeholder:text-[#9E9587]/40 focus:border-[#C8A252] focus:outline-none focus:ring-1 focus:ring-[#C8A252]/40"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading || !displayName.trim()}
                className="w-full py-2.5 rounded-xl bg-white/10 border border-white/15 text-[#F2ECE1] font-semibold text-xs uppercase tracking-wider hover:bg-[#C8A252] hover:text-[#0B0A08] hover:border-[#C8A252] active:scale-[0.98] disabled:opacity-40 transition-all cursor-pointer"
              >
                {actionLoading ? "Saving..." : "Save Profile"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
