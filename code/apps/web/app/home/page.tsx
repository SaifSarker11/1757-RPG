"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { ThemeControl } from "@/components/ThemeControl";
import { MusicControl } from "@/components/MusicControl";
import { BATTLEFIELD_ART } from "@/lib/artwork";

const API_URL =
  typeof window !== "undefined"
    ? ""
    : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001");



export default function HomePage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();


  const [displayName, setDisplayName] = useState("");
  const [courtName, setCourtName] = useState("");
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




  useEffect(() => {
    if (session?.user) {
      setDisplayName(session.user.name);
      setCourtName(session.user.name);
      // Fetch extended profile & stats
      fetch(`${API_URL}/api/users/me`, { credentials: "include" })
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (json?.data) {
            if (json.data.name) { setDisplayName(json.data.name); setCourtName(json.data.name); }
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



  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/login");
    }
  }, [isPending, session, router]);

  async function handleSignOut() {
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
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

      setCourtName(displayName.trim());
      setProfileMessage("Profile updated successfully");
    } catch (err) {
      setProfileMessage(err instanceof Error ? err.message : "Error updating profile");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateRoom = async () => {
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
      <main className="flex min-h-screen items-center justify-center bg-base-100 text-base-content font-retro">
        <div className="text-center font-sans">
          <span className="loading loading-spinner loading-lg text-accent mb-4"></span>
          <p className="text-2xl font-bold tracking-widest font-retro">UNROLLING OLD SCROLLS...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="game-shell dashboard-shell min-h-screen text-base-content font-sans px-4 py-6 md:px-8" style={{ ["--battlefield-image" as string]: `url("${BATTLEFIELD_ART}")` }}>
      <header className="game-header mx-auto max-w-7xl">
        <div className="min-w-0"><span className="game-wordmark">1757</span><span className="council-kicker block">The court of Bengal</span></div>
        <div className="game-header-tools"><MusicControl /><ThemeControl /><button onClick={handleSignOut} className="btn btn-ghost btn-sm">Leave</button></div>
      </header>
      <div className="dashboard-heading mx-auto max-w-7xl">
        <span className="council-kicker">Plassey · 23 June 1757</span>
        <h1>The council awaits.</h1>
        <p>Welcome back, {courtName}.</p>
      </div>
      {error && <div className="alert alert-error mx-auto mb-6 max-w-7xl" role="alert">{error}</div>}
      <div className="dashboard-layout mx-auto max-w-7xl">
        <section className="dashboard-council">
          <div className="dashboard-art"><img src={BATTLEFIELD_ART} alt="The Plassey battlefield: troops, cannons, elephants and cavalry" /><span>Trust is a dangerous thing.</span></div>
          <div className="dashboard-actions">
            <section className="dashboard-section">
              <span className="council-kicker">01 · Convene</span><h2>Create chamber</h2>
              <div className="council-mode-selector" role="radiogroup" aria-label="Room mode">
                {([{ mode: 'STANDARD', title: 'Standard Council' }, { mode: 'CUSTOM', title: 'Royal Decree' }] as const).map(option => <button key={option.mode} type="button" role="radio" aria-checked={roomMode === option.mode} className="btn btn-sm" data-selected={roomMode === option.mode} onClick={() => setRoomMode(option.mode)}>{option.title}</button>)}
              </div>
              <div className="dashboard-create-fields">
                <label className="min-w-0"><span className="council-field-label">Max capacity</span><input type="number" min={6} max={15} value={maxPlayers} onChange={e => setMaxPlayers(parseInt(e.target.value, 10))} className="input input-bordered w-full" /></label>
                <button onClick={handleCreateRoom} disabled={actionLoading} className="btn btn-primary">{actionLoading ? 'CREATING...' : roomMode === 'CUSTOM' ? 'NEW CUSTOM ROOM' : 'NEW ROOM'} <span aria-hidden="true">↗</span></button>
              </div>
            </section>
            <form onSubmit={handleJoinRoomByCode} className="dashboard-section">
              <span className="council-kicker">02 · Take your seat</span><h2>Enter chamber</h2>
              <label><span className="council-field-label">Registry code or room ID</span><input type="text" placeholder="e.g. A1B2C3" value={joinCode} onChange={e => setJoinCode(e.target.value)} required className="input input-bordered w-full" /></label>
              <button type="submit" disabled={actionLoading || !joinCode.trim()} className="btn btn-primary mt-5 w-full">{actionLoading ? 'JOINING...' : 'JOIN CHAMBER'} <span aria-hidden="true">→</span></button>
            </form>
          </div>
        </section>
        <aside className="dashboard-profile">
          <span className="council-kicker">Your place in the court</span><h2>{courtName}</h2>
          <form onSubmit={handleUpdateProfile} className="mb-6 space-y-3">
            <label className="block"><span className="council-field-label">Game display name</span><input type="text" autoComplete="nickname" maxLength={50} value={displayName} onChange={e => setDisplayName(e.target.value)} className="input input-bordered w-full" required /></label>
            <button type="submit" disabled={actionLoading || !displayName.trim()} className="btn btn-primary w-full">{actionLoading ? 'SAVING...' : 'SAVE DISPLAY NAME'}</button>
          </form>
          {profileMessage && <p role="status" className="my-4 text-sm">{profileMessage}</p>}
          {userStats && <dl className="profile-ledger">
            <div><dt>Level</dt><dd>{userStats.level}</dd></div><div><dt>Total XP</dt><dd>{userStats.xp}</dd></div>
            <div><dt>Matches</dt><dd>{userStats.matchesPlayed}</dd></div><div><dt>Win rate</dt><dd>{userStats.winRate}%</dd></div>
          </dl>}
          <details className="profile-details"><summary>Profile settings</summary>
            <form onSubmit={handleUpdateProfile} className="mt-5 space-y-4">
              <label className="block"><span className="council-field-label">Handle / username</span><input type="text" placeholder="e.g. siraj1757" value={username} onChange={e => setUsername(e.target.value)} className="input input-bordered w-full" /></label>
              <button type="submit" disabled={actionLoading || !displayName.trim()} className="btn btn-primary w-full">{actionLoading ? 'SAVING...' : 'SAVE PROFILE'}</button>
            </form>
          </details>
        </aside>
      </div>
    </main>
  );
}
