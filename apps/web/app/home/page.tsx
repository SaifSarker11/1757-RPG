"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

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

  // Theme selector state
  const [currentTheme, setCurrentTheme] = useState("retro");

  // Profile Settings state
  const [displayName, setDisplayName] = useState("");
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

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

  useEffect(() => {
    if (session?.user) {
      setDisplayName(session.user.name);
    }
  }, [session]);

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

      // Revalidate better-auth session client cache to update names in all client views
      await authClient.getSession({ fetchOptions: { cache: "no-store" } });
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

        {/* RIGHT COLUMN: Profile Settings (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="card bg-base-100 border border-base-300 shadow-md p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-serif font-bold text-primary border-b pb-2 mb-4">Player Profile Settings</h3>
              <p className="text-xs text-base-content/70 mb-4">
                Update your display name here. Anonymous guest profiles are fully supported, but setting a unique name will make you identifiable to other council members.
              </p>
            </div>

            {profileMessage && (
              <div className="alert alert-info text-xs font-bold py-2 rounded-lg mb-4">
                <span>{profileMessage}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="form-control">
                <span className="label-text font-bold mb-1">Display Name</span>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="input input-bordered w-full font-sans bg-base-200"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading || !displayName.trim()}
                className="btn btn-primary w-full"
              >
                {actionLoading ? "Updating..." : "Update Settings"}
              </button>
            </form>
          </div>
        </div>

      </div>
    </main>
  );
}
