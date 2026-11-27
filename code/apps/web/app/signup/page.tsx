"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { gameAudio } from "@/lib/audio";
import Link from "next/link";
import { AuthShell, Field } from "@/components/site/AuthShell";

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
      title="Join the court."
      subtitle="Keep your level, XP and match history."
      footer={<>Already sworn in? <Link href="/login" className="link link-primary">Sign in</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Display name" required maxLength={32} autoComplete="nickname" value={name} onChange={(e) => setName(e.target.value)} />
        <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label="Password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p role="alert" className="alert alert-error rounded-xl py-2 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="btn btn-primary lamp-glow w-full rounded-full">
          {loading ? <span className="loading loading-spinner loading-sm" /> : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}
