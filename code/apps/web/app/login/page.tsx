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
      <button type="button" onClick={handleGuestLogin} disabled={loading} className="btn btn-primary lamp-glow w-full rounded-full">
        {loading ? <span className="loading loading-spinner loading-sm" /> : "Play as guest"}
      </button>
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
