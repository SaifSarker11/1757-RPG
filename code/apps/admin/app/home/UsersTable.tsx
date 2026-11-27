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
      <div className="bg-surface border border-cream/20 p-8 rounded-lg text-center text-foreground/60 font-mono text-sm">
        No users found.
      </div>
    );
  }

  return (
    <div className="bg-surface border border-cream/20 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-cream/20 flex justify-between items-center">
        <h3 className="text-base font-bold text-foreground font-mono">User Accounts ({total})</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm font-sans">
          <thead className="bg-background/60 font-mono text-xs uppercase text-foreground/70 border-b border-cream/20">
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
          <tbody className="divide-y divide-cream/15">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gold/10 transition-colors">
                <td className="p-3 font-medium text-foreground">{u.name}</td>
                <td className="p-3 font-mono text-foreground/70">
                  {u.username ? `@${u.username}` : "—"}
                </td>
                <td className="p-3 text-foreground/70 font-mono text-xs">{u.email}</td>
                <td className="p-3 font-mono text-foreground">
                  <span className="text-gold font-bold">Lvl {u.level}</span>{" "}
                  <span className="text-foreground/60 text-xs">({u.xp} XP)</span>
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-mono border rounded ${
                      u.isAnonymous
                        ? "bg-gold/15 text-foreground/70 border-gold/35"
                        : "bg-cream text-royal border-cream"
                    }`}
                  >
                    {u.isAnonymous ? "GUEST" : "VERIFIED"}
                  </span>
                </td>
                <td className="p-3 text-foreground/70 text-xs font-mono">
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
                      className="px-2 py-1 text-xs font-mono border border-gold/35 bg-gold/15 hover:bg-gold/25 text-foreground rounded"
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
