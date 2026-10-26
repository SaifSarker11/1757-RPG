"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { gameAudio } from "@/lib/audio";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

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
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(10);
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
      const res = await fetch(`${API_URL}/users/update-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          name: displayName.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update profile");
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
      <main className="flex min-h-screen items-center justify-center bg-stone-900 text-amber-500 font-retro">
        <div className="text-center font-sans">
          <span className="loading loading-spinner loading-lg text-amber-500 mb-4"></span>
          <p className="text-2xl font-bold tracking-widest font-retro">UNROLLING OLD SCROLLS...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-base-200 text-base-content font-sans p-4 md:p-6 flex flex-col items-center scanlines">
      
      {/* Navbar Banner in 2D Indie style */}
      <div className="navbar bg-base-100 border-4 border-primary shadow-[4px_4px_0px_0px_var(--color-primary)] rounded-none w-full max-w-5xl px-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1">
          <span className="font-historical text-2xl font-extrabold tracking-wide uppercase text-primary drop-shadow">Battle of Plassey 1757</span>
        </div>

        <div className="flex-none flex items-center gap-3">
          {/* Sound Toggle */}
          <button 
            onClick={toggleSound}
            className={`btn btn-sm btn-outline border-2 rounded-none font-pixel ${soundEnabled ? "btn-accent text-accent-content" : ""}`}
          >
            {soundEnabled ? "SFX: ON 🔊" : "SFX: OFF 🔇"}
          </button>

          <span className="text-xs font-pixel uppercase bg-neutral text-neutral-content px-3 py-1.5 border border-base-300">
            {session.user.name}
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
            onClick={handleSignOut}
            className="btn btn-error btn-sm rounded-none border-2 font-pixel"
          >
            Leave
          </button>
        </div>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-stretch">
        
        {/* LEFT COLUMN: Controls Dashboard (7 Columns) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-base-100 border-4 border-base-content/20 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.15)] p-6 flex flex-col gap-6 flex-1 justify-between pixel-card">
            
            <div>
              <h2 className="text-2xl font-historical font-extrabold uppercase tracking-wide border-b-4 border-double pb-2 mb-4 text-primary">Lobby Secretary</h2>
              <p className="text-sm font-sans leading-relaxed text-base-content/85">
                Welcome, commander. Choose to initialize a new secretariat chamber or enter an active council session using the room registry code below.
              </p>
            </div>

            {error && (
              <div className="alert alert-error text-xs font-pixel py-3 rounded-none border-2 border-error">
                <span>{error}</span>
              </div>
            )}

            {/* Action 1: Create a Room */}
            <div className="bg-base-200 p-5 rounded-none border-2 border-base-content/10">
              <h3 className="text-lg font-pixel font-bold text-secondary mb-2 uppercase">Create Chamber</h3>
              <p className="text-xs text-base-content/75 mb-4 font-sans">Initialize a new secure game room. Choose the maximum capacity limit (6-15 players).</p>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                <div className="form-control flex-1">
                  <span className="label-text font-pixel font-bold mb-1">Max Capacity</span>
                  <input
                    type="number"
                    min={6}
                    max={15}
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(parseInt(e.target.value, 10))}
                    className="input input-bordered w-full font-pixel bg-base-100 rounded-none border-2"
                  />
                </div>
                
                <button
                  onClick={handleCreateRoom}
                  disabled={actionLoading}
                  className="btn btn-primary rounded-none font-pixel border-2 pixel-btn"
                >
                  {actionLoading ? "CREATING..." : "NEW ROOM"}
                </button>
              </div>
            </div>

            {/* Action 2: Join by Room Code */}
            <form onSubmit={handleJoinRoomByCode} className="bg-base-200 p-5 rounded-none border-2 border-base-content/10">
              <h3 className="text-lg font-pixel font-bold text-secondary mb-2 uppercase">Enter Chamber</h3>
              <p className="text-xs text-base-content/75 mb-4 font-sans">Input the 6-character uppercase registry code or paste the full room ID directly.</p>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                <div className="form-control flex-1">
                  <span className="label-text font-pixel font-bold mb-1">Registry Code</span>
                  <input
                    type="text"
                    placeholder="e.g. A1B2C3"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    required
                    className="input input-bordered w-full font-pixel bg-base-100 rounded-none border-2"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading || !joinCode.trim()}
                  className="btn btn-accent rounded-none font-pixel border-2 pixel-btn"
                >
                  {actionLoading ? "JOINING..." : "JOIN CHAMBER"}
                </button>
              </div>
            </form>

          </div>
        </div>

        {/* RIGHT COLUMN: Profile Settings (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="bg-base-100 border-4 border-base-content/20 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.15)] p-6 flex flex-col justify-between pixel-card">
            <div>
              <h3 className="text-xl font-historical font-bold text-primary border-b-4 border-double pb-2 mb-4 uppercase">Profile Settings</h3>
              <p className="text-xs text-base-content/70 mb-4 font-sans">
                Update your display name here. Anonymous guest profiles are supported, but setting a unique name makes it easier for other conspirators to identify you.
              </p>
            </div>

            {profileMessage && (
              <div className="alert alert-info text-xs font-pixel py-2 rounded-none border-2 border-info mb-4">
                <span>{profileMessage}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="form-control">
                <span className="label-text font-pixel font-bold mb-1">Display Name</span>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="input input-bordered w-full font-pixel bg-base-200 rounded-none border-2"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading || !displayName.trim()}
                className="btn btn-primary w-full rounded-none font-pixel border-2 pixel-btn"
              >
                {actionLoading ? "SAVING..." : "UPDATE NAME"}
              </button>
            </form>
          </div>
        </div>

      </div>
    </main>
  );
}
