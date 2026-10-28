"use client";

import { useEffect, useMemo, useState } from "react";
import type { NamedRoleId, RoleId, Team } from "@repo/game-engine";
import { gameAudio } from "@/lib/audio";
import {
  ALL_NAMED_ROLES,
  DISCUSSION_SECONDS,
  MAX_PLAYERS,
  MIN_PLAYERS,
  ROLE_INFO,
  TEAM_SEATS,
  TOTAL_ROUNDS,
  dependencyClosure,
} from "@/lib/role-rules";

const FILLERS: RoleId[] = ["LOYALIST", "EIC_SPY"];
const TEAM_STYLE: Record<Team, string> = {
  GREEN: "text-emerald-500",
  RED: "text-rose-500",
  GOLD: "text-amber-500",
};

export interface CustomRoomData {
  discussionSeconds: number;
  roundDiscussionSeconds: number[];
  enabledRoles: NamedRoleId[];
  fixedRoleCount: number;
}

interface Props {
  roomId: string;
  apiUrl: string;
  room: CustomRoomData;
  /** Join order, which is also seat order. */
  players: Array<{ userId: string; name: string }>;
  isHost: boolean;
}

const isFiller = (role: RoleId) => FILLERS.includes(role);

function roundTimers(room: CustomRoomData): number[] {
  return Array.from(
    { length: TOTAL_ROUNDS },
    (_, i) => room.roundDiscussionSeconds[i] ?? room.discussionSeconds
  );
}

/**
 * Problems with the pinned roles for the current table size. The server runs
 * the real check when the game starts; this just warns the host early.
 */
function assignmentProblems(assigned: RoleId[], playerCount: number): string[] {
  if (playerCount < MIN_PLAYERS || playerCount > MAX_PLAYERS) return [];
  const seats = TEAM_SEATS[playerCount]!;
  const named = new Set<NamedRoleId>(["NAWAB_SIRAJ"]);
  for (const role of assigned) {
    if (!isFiller(role)) for (const r of dependencyClosure(role as NamedRoleId)) named.add(r);
  }
  const used: Record<Team, number> = { GREEN: 0, RED: 0, GOLD: 0 };
  for (const r of named) used[ROLE_INFO[r].team] += 1;
  used.GREEN += assigned.filter((r) => r === "LOYALIST").length;
  used.RED += assigned.filter((r) => r === "EIC_SPY").length;

  // Without Jagat Seth the Gold seat is played as a Green Loyalist.
  const greenRoom = seats.GREEN + (named.has("JAGAT_SETH") ? 0 : seats.GOLD);
  const problems: string[] = [];
  if (used.GREEN > greenRoom) problems.push(`Needs ${used.GREEN} Green seats; ${playerCount} players have ${greenRoom}.`);
  if (used.RED > seats.RED) problems.push(`Needs ${used.RED} Red seats; ${playerCount} players have ${seats.RED}.`);
  if (used.GOLD > seats.GOLD) problems.push(`Jagat Seth needs a Gold seat (9+ players).`);
  return problems;
}

/** Lobby panel for custom rooms: the host edits, everyone else reads. */
export function CustomRoomSettings({ roomId, apiUrl, room, players, isHost }: Props) {
  const [timers, setTimers] = useState<number[]>(() => roundTimers(room));
  const [sameForAll, setSameForAll] = useState(() => new Set(roundTimers(room)).size === 1);
  const [enabled, setEnabled] = useState<Set<NamedRoleId>>(() => new Set(room.enabledRoles));
  const [assignments, setAssignments] = useState<Record<string, RoleId>>({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  // Follow other updates (e.g. another tab) until the host starts editing.
  useEffect(() => {
    if (dirty) return;
    setTimers(roundTimers(room));
    setEnabled(new Set(room.enabledRoles));
  }, [room, dirty]);

  useEffect(() => {
    if (!isHost) return;
    fetch(`${apiUrl}/rooms/${roomId}/role-assignments`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.roleAssignments) setAssignments(json.roleAssignments);
      })
      .catch(() => {});
  }, [apiUrl, roomId, isHost]);

  const present = useMemo(() => new Set(players.map((p) => p.userId)), [players]);
  const pinned = Object.entries(assignments).filter(([id]) => present.has(id));
  const problems = assignmentProblems(pinned.map(([, r]) => r), players.length);

  const edit = () => {
    setDirty(true);
    setMessage(null);
  };

  const setTimer = (index: number, value: number) => {
    edit();
    setTimers((prev) => (sameForAll ? prev.map(() => value) : prev.map((t, i) => (i === index ? value : t))));
  };

  const toggleRole = (role: NamedRoleId) => {
    if (role === "NAWAB_SIRAJ") return;
    gameAudio.playClick();
    edit();
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  };

  const assign = (userId: string, value: string) => {
    edit();
    setAssignments((prev) => {
      const next = { ...prev };
      if (value === "") delete next[userId];
      else next[userId] = value as RoleId;
      return next;
    });
    // A pinned character and the characters it needs are always in the game.
    if (value && !isFiller(value as RoleId)) {
      setEnabled((prev) => new Set([...prev, ...dependencyClosure(value as NamedRoleId)]));
    }
  };

  const timersValid = timers.every(
    (t) => Number.isInteger(t) && t >= DISCUSSION_SECONDS.min && t <= DISCUSSION_SECONDS.max
  );

  const save = async () => {
    gameAudio.playClick();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`${apiUrl}/rooms/${roomId}/settings`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roundDiscussionSeconds: timers,
          enabledRoles: [...enabled],
          // Players who left drop out of the assignments.
          roleAssignments: Object.fromEntries(pinned),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Couldn't save the decree");
      }
      setDirty(false);
      setMessage({ ok: true, text: "Decree sealed." });
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Couldn't save the decree" });
    } finally {
      setSaving(false);
    }
  };

  const pinnedTo = (role: RoleId) => pinned.find(([, r]) => r === role)?.[0];

  if (!isHost) {
    return (
      <div className="bg-base-100 border-4 border-base-content/20 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.15)] p-4 pixel-card font-pixel text-[10px] space-y-3">
        <h3 className="text-secondary uppercase border-b-2 border-dashed pb-1.5 border-base-content/20">
          Royal Decree · Custom Rules
        </h3>
        <div>
          <span className="text-base-content/60 uppercase block mb-1">Discussion per round</span>
          <div className="flex flex-wrap gap-1">
            {roundTimers(room).map((t, i) => (
              <span key={i} className="badge badge-outline rounded-none">R{i + 1}: {t}s</span>
            ))}
          </div>
        </div>
        <div>
          <span className="text-base-content/60 uppercase block mb-1">Characters allowed</span>
          <div className="flex flex-wrap gap-1">
            {ALL_NAMED_ROLES.filter((r) => room.enabledRoles.includes(r) || r === "NAWAB_SIRAJ").map((r) => (
              <span key={r} className={`badge badge-outline rounded-none ${TEAM_STYLE[ROLE_INFO[r].team]}`}>
                {ROLE_INFO[r].name}
              </span>
            ))}
          </div>
        </div>
        <p className="font-sans text-xs text-base-content/75">
          {room.fixedRoleCount > 0
            ? `The host has fixed the roles of ${room.fixedRoleCount} seat(s); the rest are dealt at random.`
            : "Every seat is dealt at random."}{" "}
          The host can pause and skip timers during the match.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-base-100 border-4 border-secondary/50 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.15)] p-5 pixel-card space-y-5">
      <div className="flex items-center justify-between border-b-4 border-double pb-2">
        <h3 className="text-lg font-historical font-extrabold uppercase text-primary">Royal Decree</h3>
        <span className="badge badge-secondary rounded-none font-pixel text-[9px]">CUSTOM RULES</span>
      </div>

      {/* 1. Round timers */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-pixel text-xs font-bold uppercase text-secondary">Discussion time per round</h4>
          <label className="label cursor-pointer gap-2 p-0">
            <span className="font-pixel text-[9px] uppercase">Same for all</span>
            <input
              type="checkbox"
              className="checkbox checkbox-xs rounded-none"
              checked={sameForAll}
              onChange={(e) => {
                setSameForAll(e.target.checked);
                if (e.target.checked) {
                  edit();
                  setTimers((prev) => prev.map(() => prev[0] ?? DISCUSSION_SECONDS.default));
                }
              }}
            />
          </label>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {timers.map((t, i) => (
            <label key={i} className="flex flex-col gap-1">
              <span className="font-pixel text-[9px] text-base-content/60">R{i + 1} (sec)</span>
              <input
                type="number"
                min={DISCUSSION_SECONDS.min}
                max={DISCUSSION_SECONDS.max}
                step={5}
                value={Number.isNaN(t) ? "" : t}
                disabled={sameForAll && i > 0}
                onChange={(e) => setTimer(i, parseInt(e.target.value, 10))}
                className="input input-bordered input-sm w-full font-pixel bg-base-200 rounded-none border-2 px-1"
              />
            </label>
          ))}
        </div>
        {!timersValid && (
          <p className="text-error text-[10px] font-pixel mt-1">
            Each round needs {DISCUSSION_SECONDS.min}–{DISCUSSION_SECONDS.max} seconds.
          </p>
        )}
      </section>

      {/* 2. Allowed characters */}
      <section>
        <h4 className="font-pixel text-xs font-bold uppercase text-secondary mb-2">Characters allowed</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1">
          {ALL_NAMED_ROLES.map((role) => {
            const def = ROLE_INFO[role];
            const locked = role === "NAWAB_SIRAJ";
            return (
              <label key={role} className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  className="checkbox checkbox-xs rounded-none"
                  checked={locked || enabled.has(role)}
                  disabled={locked}
                  onChange={() => toggleRole(role)}
                />
                <span className={TEAM_STYLE[def.team]}>{def.name}</span>
              </label>
            );
          })}
        </div>
        <p className="text-[10px] text-base-content/60 mt-2 font-sans">
          Some characters need others (e.g. Mir Jafar needs Mir Madan); a character is only dealt when everything it
          needs is allowed. Empty seats become Loyalists or EIC Spies.
        </p>
      </section>

      {/* 3. Seat assignments */}
      <section>
        <h4 className="font-pixel text-xs font-bold uppercase text-secondary mb-2">Seat assignments</h4>
        <div className="space-y-1.5">
          {players.map((p, seat) => {
            const current = assignments[p.userId] ?? "";
            const option = (role: RoleId) => {
              const holder = isFiller(role) ? undefined : pinnedTo(role);
              const taken = holder !== undefined && holder !== p.userId;
              return (
                <option key={role} value={role} disabled={taken}>
                  {ROLE_INFO[role].name}
                  {taken ? " (taken)" : ""}
                </option>
              );
            };
            const offered = (team: Team) =>
              ALL_NAMED_ROLES.filter(
                (r) => ROLE_INFO[r].team === team && (enabled.has(r) || r === "NAWAB_SIRAJ" || r === current)
              );
            return (
              <div key={p.userId} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-pixel text-[9px] shrink-0 whitespace-nowrap text-base-content/60">SEAT {seat + 1}</span>
                <span className="font-pixel text-[10px] flex-1 min-w-0 truncate uppercase">{p.name}</span>
                <select
                  value={current}
                  onChange={(e) => assign(p.userId, e.target.value)}
                  className="select select-bordered select-xs rounded-none border-2 font-pixel text-[10px] w-full sm:w-44 bg-base-200"
                >
                  <option value="">🎲 Random</option>
                  <optgroup label="Green">{offered("GREEN").map(option)}</optgroup>
                  <optgroup label="Red">{offered("RED").map(option)}</optgroup>
                  <optgroup label="Gold">{offered("GOLD").map(option)}</optgroup>
                  <optgroup label="Fillers">{FILLERS.map(option)}</optgroup>
                </select>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-base-content/60 mt-2 font-sans">
          Seats follow join order. Only you can see these assignments.
        </p>
        {problems.length > 0 && (
          <div className="alert alert-warning rounded-none border-2 text-[10px] font-pixel py-2 mt-2 flex flex-col items-start gap-0.5">
            {problems.map((p) => (
              <span key={p}>⚠ {p}</span>
            ))}
          </div>
        )}
      </section>

      {/* 4. Skip & pause */}
      <p className="text-[10px] text-base-content/70 font-sans border-t border-dashed border-base-content/20 pt-3">
        During the match you&apos;ll have a <b>PAUSE</b> button that freezes the timer for everyone, and a{" "}
        <b>SKIP</b> button that ends the current timer straight away.
      </p>

      {message && (
        <div className={`alert ${message.ok ? "alert-success" : "alert-error"} rounded-none border-2 text-[10px] font-pixel py-2`}>
          <span>{message.text}</span>
        </div>
      )}

      <button
        onClick={save}
        disabled={saving || !dirty || !timersValid}
        className="btn btn-secondary w-full rounded-none font-pixel border-2 pixel-btn"
      >
        {saving ? "SEALING..." : dirty ? "SEAL DECREE" : "DECREE SEALED"}
      </button>
    </div>
  );
}
