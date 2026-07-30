"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    <main className="min-h-screen bg-[#f3e9d2] bg-[radial-gradient(#e6d5b8_1px,transparent_1px)] [background-size:16px_16px] text-[#3e2723] font-serif p-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-[#fdfbf7] border-4 border-[#8d6e63] shadow-2xl rounded-2xl p-8 relative overflow-hidden">
        
        {/* Ink Stain Decoration */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-amber-900/5 rounded-full blur-xl pointer-events-none"></div>

        <div className="space-y-2 text-center mb-6">
          <h1 className="text-3xl font-extrabold tracking-wide text-[#5d4037] uppercase">Battle of Plassey 1757</h1>
          <p className="text-xs text-[#795548] font-sans font-semibold tracking-wider uppercase">Grand Secretariat Entry</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-1 text-sm font-sans font-bold text-[#5d4037]">
            <span>Email</span>
            <input
              className="w-full rounded-lg border border-[#a1887f] px-3 py-2 bg-white text-[#3e2723] font-sans focus:outline-none focus:ring-1 focus:ring-[#8d6e63]"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="block space-y-1 text-sm font-sans font-bold text-[#5d4037]">
            <span>Password</span>
            <input
              className="w-full rounded-lg border border-[#a1887f] px-3 py-2 bg-white text-[#3e2723] font-sans focus:outline-none focus:ring-1 focus:ring-[#8d6e63]"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {error ? (
            <div className="bg-rose-100 border border-rose-300 text-rose-900 text-xs px-3 py-2.5 rounded-lg font-sans font-bold">
              {error}
            </div>
          ) : null}

          <button
            className="w-full rounded-lg bg-[#5d4037] text-white font-sans font-bold text-sm px-4 py-2.5 hover:bg-[#4e342e] active:scale-95 transition-all shadow-md disabled:opacity-50"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="relative my-5 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#d7ccc8]"></div>
          </div>
          <span className="relative bg-[#fdfbf7] px-3 text-xs font-sans text-[#795548] uppercase tracking-wider">or</span>
        </div>

        <button
          className="w-full rounded-lg border border-[#a1887f] text-[#5d4037] bg-white font-sans font-bold text-sm px-4 py-2.5 hover:bg-zinc-50 active:scale-95 transition-all shadow-xs disabled:opacity-50"
          type="button"
          onClick={handleGuestLogin}
          disabled={loading}
        >
          Continue as guest
        </button>

        <p className="text-center text-xs font-sans text-[#795548] mt-6">
          Need an account?{" "}
          <a className="font-bold text-[#5d4037] underline hover:text-[#4e342e]" href="/signup">
            Sign up
          </a>
        </p>
      </div>
    </main>
  );
}
