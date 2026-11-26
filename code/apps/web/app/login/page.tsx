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
    <main className="relative flex min-h-screen items-center justify-center bg-[#ececeb] p-4 font-sans text-[#111] antialiased">
      <div aria-hidden className="grain-overlay" />
      <div className="relative w-full max-w-md">
        <div className="rounded-[26px] border border-[#e6e6e4] bg-white p-8 shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.04),0_24px_48px_-28px_rgba(0,0,0,0.22)]">
          {/* Header */}
          <div className="mb-7 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ffd4c2] bg-[#fff2ec] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[#c53a00] font-mono">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[#ff5206]" />
              Plassey · 1757
            </span>
            <h1 className="mt-4 text-[24px] font-medium tracking-[-0.02em] text-[#111]">
              Sign in to the court.
            </h1>
            <p className="mt-1.5 text-[14px] font-light text-[#5c5c5c]">
              Secretariat log-in — the Nawab is expecting you.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-1.5">
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#8a8a8a] font-mono">
                Email
              </span>
              <input
                className="w-full rounded-[12px] border border-[#e6e6e4] bg-[#f8f8f8] px-3.5 py-2.5 text-[14px] text-[#111] transition-colors placeholder:text-[#8a8a8a] focus:border-[#ff5206] focus:outline-none focus:ring-2 focus:ring-[#ff5206]/20"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#8a8a8a] font-mono">
                Password
              </span>
              <input
                className="w-full rounded-[12px] border border-[#e6e6e4] bg-[#f8f8f8] px-3.5 py-2.5 text-[14px] text-[#111] transition-colors placeholder:text-[#8a8a8a] focus:border-[#ff5206] focus:outline-none focus:ring-2 focus:ring-[#ff5206]/20"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>

            {error ? (
              <div className="rounded-[12px] border border-[#a8291b]/20 bg-[#fdeeec] px-3 py-2.5 text-[13px] text-[#a8291b]">
                {error}
              </div>
            ) : null}

            <button
              className="w-full rounded-full bg-[#ff5206] px-4 py-2.5 text-[14px] font-medium text-white transition-all duration-300 hover:bg-[#e84700] hover:shadow-[0_8px_20px_-6px_rgba(255,82,6,0.55)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Enter the Court"}
            </button>
          </form>

          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#e6e6e4]" />
            </div>
            <span className="relative bg-white px-3 text-[10px] font-medium uppercase tracking-[0.18em] text-[#8a8a8a] font-mono">
              OR
            </span>
          </div>

          <button
            className="w-full rounded-full border border-[#e6e6e4] bg-white px-4 py-2.5 text-[14px] font-medium text-[#111] transition-all duration-300 hover:border-[#d4d4d1] hover:bg-[#f4f4f3] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={handleGuestLogin}
            disabled={loading}
          >
            Continue as a Guest
          </button>

          <p className="mt-6 text-center text-[13px] font-light text-[#5c5c5c]">
            New to the court?{" "}
            <a
              className="font-medium text-[#c53a00] underline decoration-[#ffd4c2] underline-offset-2 transition-colors hover:text-[#ff5206]"
              href="/signup"
              onClick={() => gameAudio.playClick()}
            >
              Create an account
            </a>
          </p>
        </div>

        <p className="mt-5 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-[#8a8a8a]">
          <a href="/" className="transition-colors hover:text-[#111]">
            ← Back to the landing page
          </a>
        </p>
      </div>
    </main>
  );
}
