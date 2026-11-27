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

    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message ?? "Unable to sign in");
      return;
    }

    router.push("/home");
    router.refresh();
  }

  async function handleGuestLogin() {
    setLoading(true);
    setError(null);

    const { error: guestError } = await authClient.signIn.anonymous();

    setLoading(false);

    if (guestError) {
      setError(guestError.message ?? "Unable to continue as guest");
      return;
    }

    router.push("/home");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-gold/40 bg-surface p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Admin sign in</h1>
          <p className="text-sm text-foreground/60">Use your account or continue as a guest.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-1 text-sm">
            <span>Email</span>
            <input
              className="w-full rounded-md border border-cream/35 px-3 py-2"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span>Password</span>
            <input
              className="w-full rounded-md border border-cream/35 px-3 py-2"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {error ? <p className="text-sm text-gold">{error}</p> : null}

          <button
            className="w-full rounded-md bg-gold px-4 py-2 text-royal disabled:opacity-50"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <button
          className="w-full rounded-md border border-cream/35 px-4 py-2 disabled:opacity-50"
          type="button"
          onClick={handleGuestLogin}
          disabled={loading}
        >
          Continue as guest
        </button>

        <p className="text-center text-sm text-foreground/60">
          Need an account?{" "}
          <a className="font-medium text-gold underline" href="/signup">
            Sign up
          </a>
        </p>
      </div>
    </main>
  );
}
