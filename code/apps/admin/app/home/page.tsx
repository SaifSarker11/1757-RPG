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

// Same-origin: next.config rewrites /api/* to the game server, so the
// session cookie set on this domain is sent with admin requests.
const API_URL = "";

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
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground/60 font-mono text-sm">
        Authenticating admin session...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground font-sans p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-cream/20 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gold animate-pulse" />
              <h1 className="text-2xl font-black font-mono tracking-tight text-foreground">
                1757 RPG — ADMIN CONTROL CONSOLE
              </h1>
            </div>
            <p className="text-xs text-foreground/70 mt-1 font-mono">
              Signed in as <span className="text-foreground font-bold">{session.user.name}</span> ({session.user.email})
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchAdminData}
              disabled={loading}
              className="px-3 py-1.5 rounded bg-surface border border-gold/35 text-xs font-mono hover:bg-gold/10 text-foreground"
            >
              {loading ? "Refreshing..." : "↻ Refresh"}
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="px-3 py-1.5 rounded bg-cream/10 border border-cream/35 text-xs font-mono text-royal hover:bg-cream"
            >
              Sign Out
            </button>
          </div>
        </header>

        {feedback && (
          <div className="p-3 bg-surface border border-gold/35 text-xs font-mono text-foreground rounded">
            {feedback}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-cream/20 pb-px font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 border-b-2 font-bold uppercase transition-colors ${
              activeTab === "overview"
                ? "border-gold text-gold"
                : "border-transparent text-foreground/60 hover:text-foreground"
            }`}
          >
            Telemetry Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("matches")}
            className={`px-4 py-2 border-b-2 font-bold uppercase transition-colors ${
              activeTab === "matches"
                ? "border-gold text-gold"
                : "border-transparent text-foreground/60 hover:text-foreground"
            }`}
          >
            Match Logs ({matchesTotal})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 border-b-2 font-bold uppercase transition-colors ${
              activeTab === "users"
                ? "border-gold text-gold"
                : "border-transparent text-foreground/60 hover:text-foreground"
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
              <div className="bg-surface border border-cream/20 p-8 rounded-lg text-center text-foreground/60 font-mono text-sm">
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
