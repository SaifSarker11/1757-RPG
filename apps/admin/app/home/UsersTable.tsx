import React from "react";
import type { AdminUserRow } from "@/lib/types";

interface UsersTableProps {
  users: AdminUserRow[];
  total: number;
  onRenameUser?: (userId: string, newName: string) => void;
}

export function UsersTable({ users, total, onRenameUser }: UsersTableProps) {
  if (users.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-lg text-center text-zinc-500 font-mono text-sm">
        No users found.
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
        <h3 className="text-base font-bold text-zinc-100 font-mono">User Accounts ({total})</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm font-sans">
          <thead className="bg-zinc-950/60 font-mono text-xs uppercase text-zinc-400 border-b border-zinc-800">
            <tr>
              <th className="p-3">Display Name</th>
              <th className="p-3">Handle</th>
              <th className="p-3">Email</th>
              <th className="p-3">Level / XP</th>
              <th className="p-3">Type</th>
              <th className="p-3">Registered</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-850">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-zinc-850/50 transition-colors">
                <td className="p-3 font-medium text-zinc-200">{u.name}</td>
                <td className="p-3 font-mono text-zinc-400">
                  {u.username ? `@${u.username}` : "—"}
                </td>
                <td className="p-3 text-zinc-400 font-mono text-xs">{u.email}</td>
                <td className="p-3 font-mono text-zinc-300">
                  <span className="text-amber-400 font-bold">Lvl {u.level}</span>{" "}
                  <span className="text-zinc-500 text-xs">({u.xp} XP)</span>
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-mono border rounded ${
                      u.isAnonymous
                        ? "bg-zinc-800 text-zinc-400 border-zinc-700"
                        : "bg-blue-950/40 text-blue-400 border-blue-800"
                    }`}
                  >
                    {u.isAnonymous ? "GUEST" : "VERIFIED"}
                  </span>
                </td>
                <td className="p-3 text-zinc-400 text-xs font-mono">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="p-3 text-right">
                  {onRenameUser && (
                    <button
                      type="button"
                      onClick={() => {
                        const newName = prompt(`Enter new display name for ${u.name}:`, u.name);
                        if (newName && newName.trim()) {
                          onRenameUser(u.id, newName.trim());
                        }
                      }}
                      className="px-2 py-1 text-xs font-mono border border-zinc-700 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded"
                    >
                      Rename
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
