"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { gameAudio } from "@/lib/audio";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
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
      const { error: signUpError } = await authClient.signUp.email({
        name,
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message ?? "Unable to create account");
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
              Take your seat.
            </h1>
            <p className="mt-1.5 text-[14px] font-light text-[#5c5c5c]">
              Register a courtier — or play as a guest later.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-1.5">
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#8a8a8a] font-mono">
                Name
              </span>
              <input
                className="w-full rounded-[12px] border border-[#e6e6e4] bg-[#f8f8f8] px-3.5 py-2.5 text-[14px] text-[#111] transition-colors placeholder:text-[#8a8a8a] focus:border-[#ff5206] focus:outline-none focus:ring-2 focus:ring-[#ff5206]/20"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>

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
                minLength={8}
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
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-[13px] font-light text-[#5c5c5c]">
            Registered already?{" "}
            <a
              className="font-medium text-[#c53a00] underline decoration-[#ffd4c2] underline-offset-2 transition-colors hover:text-[#ff5206]"
              href="/login"
              onClick={() => gameAudio.playClick()}
            >
              Sign in
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
