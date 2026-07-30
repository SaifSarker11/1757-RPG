"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { gameAudio } from "@/lib/audio";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    gameAudio.playClick();
    setLoading(true);
    setError(null);

    try {
      const { error: signInError } = await authClient.signIn.email({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message ?? "Unable to sign in");
        return;
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Cannot reach auth API. Start the API first: pnpm --filter api dev"
      );
      return;
    } finally {
      setLoading(false);
    }

    router.push("/home");
    router.refresh();
  }

  async function handleGuestLogin() {
    gameAudio.playClick();
    setLoading(true);
    setError(null);

    try {
      const { error: guestError } = await authClient.signIn.anonymous();

      if (guestError) {
        setError(guestError.message ?? "Unable to continue as guest");
        return;
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Cannot reach auth API. Start the API first: pnpm --filter api dev"
      );
      return;
    } finally {
      setLoading(false);
    }

    router.push("/home");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-stone-900 bg-[radial-gradient(#2c2a29_2px,transparent_2px)] [background-size:24px_24px] text-stone-200 font-historical p-4 flex items-center justify-center scanlines">
      <div className="w-full max-w-md bg-stone-800 border-4 border-amber-600 shadow-2xl p-6 relative overflow-hidden pixel-card text-stone-200">
        
        {/* Retro Header style */}
        <div className="space-y-2 text-center mb-6 border-b-4 border-double border-amber-600 pb-4">
          <h1 className="text-3xl font-extrabold tracking-wide text-amber-500 uppercase font-historical drop-shadow-md">Battle of Plassey 1757</h1>
          <p className="text-xs text-stone-400 font-pixel tracking-widest uppercase">Secretariat Log-In</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-1 text-sm font-pixel text-amber-400">
            <span>Email</span>
            <input
              className="w-full border-2 border-stone-600 px-3 py-2 bg-stone-950 text-stone-100 font-sans focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-none"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="block space-y-1 text-sm font-pixel text-amber-400">
            <span>Password</span>
            <input
              className="w-full border-2 border-stone-600 px-3 py-2 bg-stone-950 text-stone-100 font-sans focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-none"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {error ? (
            <div className="bg-red-950 border-2 border-red-500 text-red-200 text-xs px-3 py-2.5 rounded-none font-mono">
              {error}
            </div>
          ) : null}

          <button
            className="w-full bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-stone-950 font-pixel font-bold text-sm px-4 py-2.5 transition-all pixel-btn"
            type="submit"
            disabled={loading}
          >
            {loading ? "Decrypting..." : "Enter Chamber"}
          </button>
        </form>

        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-stone-700"></div>
          </div>
          <span className="relative bg-stone-800 px-3 text-xs font-pixel text-stone-400 uppercase">OR</span>
        </div>

        <button
          className="w-full border-2 border-stone-400 text-stone-200 hover:text-stone-950 bg-stone-900 hover:bg-stone-200 font-pixel font-bold text-sm px-4 py-2.5 transition-all pixel-btn"
          type="button"
          onClick={handleGuestLogin}
          disabled={loading}
        >
          Anonymous Guest
        </button>

        <p className="text-center text-xs font-pixel text-stone-400 mt-6">
          New Agent?{" "}
          <a className="font-bold text-amber-500 underline hover:text-amber-400" href="/signup" onClick={() => gameAudio.playClick()}>
            Sign Up
          </a>
        </p>
      </div>
    </main>
  );
}
