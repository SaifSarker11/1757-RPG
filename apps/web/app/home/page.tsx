"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";

export default function HomePage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

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

  if (isPending || !session) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold">Welcome to 1757!</h1>
        <button
          className="rounded-md border border-zinc-300 px-4 py-2"
          type="button"
          onClick={handleSignOut}
        >
          Sign Out
        </button>
      </div>
    </main>
  );
}
