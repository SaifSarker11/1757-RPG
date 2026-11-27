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
      <div className="bg-gradient-to-br from-crimson/80 to-bronze/60 border border-bronze p-8 rounded-lg text-center text-champagne/60 font-mono text-sm">
        No users found.
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-crimson/80 to-bronze/60 border border-bronze rounded-lg overflow-hidden">
      <div className="p-4 border-b border-bronze flex justify-between items-center">
        <h3 className="text-base font-bold text-champagne font-mono">User Accounts ({total})</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm font-sans">
          <thead className="bg-ink/60 font-mono text-xs uppercase text-champagne/70 border-b border-bronze">
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
          <tbody className="divide-y divide-bronze/50">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-crimson/40 transition-colors">
                <td className="p-3 font-medium text-champagne">{u.name}</td>
                <td className="p-3 font-mono text-champagne/70">
                  {u.username ? `@${u.username}` : "—"}
                </td>
                <td className="p-3 text-champagne/70 font-mono text-xs">{u.email}</td>
                <td className="p-3 font-mono text-champagne/90">
                  <span className="text-champagne font-bold">Lvl {u.level}</span>{" "}
                  <span className="text-champagne/60 text-xs">({u.xp} XP)</span>
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-mono border rounded ${
                      u.isAnonymous
                        ? "bg-bronze/50 text-champagne/70 border-bronze"
                        : "bg-royal/20 text-champagne border-royal"
                    }`}
                  >
                    {u.isAnonymous ? "GUEST" : "VERIFIED"}
                  </span>
                </td>
                <td className="p-3 text-champagne/70 text-xs font-mono">
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
                      className="px-2 py-1 text-xs font-mono border border-bronze bg-bronze/50 hover:bg-crimson text-champagne/90 rounded"
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
