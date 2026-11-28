"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { AuthShell, Field } from "@/components/site/AuthShell";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [guestName, setGuestName] = useState("");
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
          : "Cannot reach the game server. Please try again in a moment."
      );
      return;
    } finally {
      setLoading(false);
    }

    router.push("/home");
    router.refresh();
  }

  async function handleGuestLogin() {
    if (!guestName.trim()) { setError("Enter your game display name"); return; }
    setLoading(true);
    setError(null);

    try {
      const { error: guestError } = await authClient.signIn.anonymous();

      if (guestError) {
        setError(guestError.message ?? "Unable to continue as guest");
        return;
      }
      const response = await fetch("/api/users/me", {
        method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: guestName.trim() }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error ?? "Unable to save your display name");
      }
      await authClient.getSession({ query: { disableCookieCache: true } });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Cannot reach the game server. Please try again in a moment."
      );
      return;
    } finally {
      setLoading(false);
    }

    router.push("/home");
    router.refresh();
  }

  return (
    <AuthShell
      title="Take your seat."
      subtitle="Sign in, or slip in as a guest."
      footer={<>New to the court? <Link href="/signup" className="link link-primary">Create an account</Link></>}
    >
      <form onSubmit={(event) => { event.preventDefault(); void handleGuestLogin(); }} className="space-y-4">
      <Field label="Game display name" autoComplete="nickname" required maxLength={50} value={guestName} onChange={(event) => setGuestName(event.target.value)} />
      <button type="submit" disabled={loading || !guestName.trim()} className="btn btn-primary lamp-glow w-full rounded-full">
        {loading ? <span className="loading loading-spinner loading-sm" /> : "Play as guest"}
      </button>
      </form>
      <div className="divider my-6 text-xs opacity-50">or with email</div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label="Password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p role="alert" className="alert alert-error rounded-xl py-2 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="btn btn-outline w-full rounded-full">
          {loading ? <span className="loading loading-spinner loading-sm" /> : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}
