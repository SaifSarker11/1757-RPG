"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import type {
  AdminUserRow,
  MatchSummaryRow,
  TelemetryOverview,
} from "@/lib/types";
import { MatchesTable } from "./MatchesTable";
import { TelemetryGrid } from "./TelemetryGrid";
import { UsersTable } from "./UsersTable";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function HomePage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const [activeTab, setActiveTab] = useState<"overview" | "matches" | "users">("overview");
  const [overview, setOverview] = useState<TelemetryOverview | null>(null);
  const [matches, setMatches] = useState<MatchSummaryRow[]>([]);
  const [matchesTotal, setMatchesTotal] = useState<number>(0);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [usersTotal, setUsersTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/login");
    }
  }, [isPending, session, router]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [ovRes, mRes, uRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/overview`, { credentials: "include" }),
        fetch(`${API_URL}/api/admin/matches?limit=25`, { credentials: "include" }),
        fetch(`${API_URL}/api/admin/users?limit=25`, { credentials: "include" }),
      ]);

      if (ovRes.ok) {
        const json = await ovRes.json();
        if (json.data) setOverview(json.data);
      }
      if (mRes.ok) {
        const json = await mRes.json();
        if (json.data) {
          setMatches(json.data.matches ?? []);
          setMatchesTotal(json.data.total ?? 0);
        }
      }
      if (uRes.ok) {
        const json = await uRes.json();
        if (json.data) {
          setUsers(json.data.users ?? []);
          setUsersTotal(json.data.total ?? 0);
        }
      }
    } catch {
      setFeedback("Failed to load administration data from API server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchAdminData();
    }
  }, [session]);

  const handleRenameUser = async (userId: string, newName: string) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (res.ok) {
        setFeedback(`User successfully renamed to "${newName}".`);
        fetchAdminData();
      } else {
        const err = await res.json().catch(() => ({}));
        setFeedback(err.error ?? "Failed to rename user.");
      }
    } catch {
      setFeedback("Error contacting API server.");
    }
    setTimeout(() => setFeedback(null), 4000);
  };

  async function handleSignOut() {
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  if (isPending || !session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-500 font-mono text-sm">
        Authenticating admin session...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-zinc-800 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-2xl font-black font-mono tracking-tight text-white">
                1757 RPG — ADMIN CONTROL CONSOLE
              </h1>
            </div>
            <p className="text-xs text-zinc-400 mt-1 font-mono">
              Signed in as <span className="text-zinc-200 font-bold">{session.user.name}</span> ({session.user.email})
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchAdminData}
              disabled={loading}
              className="px-3 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-xs font-mono hover:bg-zinc-850 text-zinc-300"
            >
              {loading ? "Refreshing..." : "↻ Refresh"}
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="px-3 py-1.5 rounded bg-rose-950/40 border border-rose-800 text-xs font-mono text-rose-300 hover:bg-rose-900/50"
            >
              Sign Out
            </button>
          </div>
        </header>

        {feedback && (
          <div className="p-3 bg-zinc-900 border border-zinc-700 text-xs font-mono text-zinc-300 rounded">
            {feedback}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-zinc-800 pb-px font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 border-b-2 font-bold uppercase transition-colors ${
              activeTab === "overview"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Telemetry Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("matches")}
            className={`px-4 py-2 border-b-2 font-bold uppercase transition-colors ${
              activeTab === "matches"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Match Logs ({matchesTotal})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 border-b-2 font-bold uppercase transition-colors ${
              activeTab === "users"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            User Directory ({usersTotal})
          </button>
        </div>

        {/* Tab Views */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {overview ? (
              <TelemetryGrid overview={overview} />
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-lg text-center text-zinc-500 font-mono text-sm">
                No telemetry statistics calculated yet. Complete a match to view data.
              </div>
            )}
          </div>
        )}

        {activeTab === "matches" && (
          <MatchesTable matches={matches} total={matchesTotal} />
        )}

        {activeTab === "users" && (
          <UsersTable
            users={users}
            total={usersTotal}
            onRenameUser={handleRenameUser}
          />
        )}

      </div>
    </main>
  );
}
