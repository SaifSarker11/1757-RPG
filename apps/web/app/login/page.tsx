"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Shield, Play } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGoogleLogin() {
    setLoading(true);
    setError(null);

    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/home",
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to auth API. Make sure the API backend is running."
      );
    } finally {
      setLoading(false);
    }
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

      router.push("/home");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Cannot reach auth API. Start the API first: pnpm --filter api dev"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-grid-pattern bg-base-200 text-base-content p-6 scanlines">
      {/* Decorative Technical Crosshairs / Grid Labels */}
      <div className="hidden md:block absolute top-6 left-6 font-mono text-[10px] text-base-content/40 select-none">
        + LOC_0.1.7.5.7 // ACCESS_PORTAL
      </div>
      <div className="hidden md:block absolute top-6 right-6 font-mono text-[10px] text-base-content/40 select-none">
        [SYS_STATUS: ONLINE] +
      </div>
      <div className="hidden md:block absolute bottom-6 left-6 font-mono text-[10px] text-base-content/40 select-none">
        + GAME_INIT_KEY_256
      </div>
      <div className="hidden md:block absolute bottom-6 right-6 font-mono text-[10px] text-base-content/40 select-none">
        BATTLE_OF_PLASSEY_1757 +
      </div>

      {/* Main Neobrutalist Login Card */}
      <div className="w-full max-w-md bg-base-100 border-4 border-base-content shadow-neo overflow-hidden relative transition-all">
        {/* Diagonal Warning Stripe Header Accent */}
        <div className="bg-diagonal-hatch h-6 border-b-4 border-base-content flex items-center justify-between px-4 text-[9px] font-mono font-bold tracking-wider text-base-content select-none">
          <span>PORTAL_SECURITY: OAUTH_GUEST</span>
          <span>1757_SYS_V2</span>
        </div>

        <div className="p-8 pb-4 flex flex-col items-center text-center">
          {/* Geometric Custom SVG Heart Logo */}
          <div className="relative mb-6 mt-2 group cursor-pointer">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 100 100"
              className="w-24 h-24 text-error stroke-base-content stroke-[4] fill-error filter drop-shadow-[4px_4px_0px_rgba(0,0,0,0.95)] transition-transform duration-200 group-hover:scale-105 active:scale-95"
            >
              {/* Custom geometric/angular heart shape */}
              <polygon points="50,90 12,52 12,24 34,10 50,26 66,10 88,24 88,52" />
              {/* Technical wireframe details */}
              <line x1="50" y1="26" x2="50" y2="90" stroke="currentColor" strokeWidth="2.5" strokeDasharray="4,4" className="opacity-30" />
              <line x1="12" y1="42" x2="88" y2="42" stroke="currentColor" strokeWidth="2.5" strokeDasharray="4,4" className="opacity-30" />
              <circle cx="50" cy="42" r="5" className="fill-base-content stroke-base-100 stroke-2 opacity-90" />
              {/* Corner design brackets inside heart viewport */}
              <path d="M22,18 L28,18 L28,24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-50" />
              <path d="M78,18 L72,18 L72,24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-50" />
            </svg>
            {/* Outer Tech Brackets framing the heart */}
            <div className="absolute -top-3 -left-3 w-4 h-4 border-t-2 border-l-2 border-base-content opacity-50"></div>
            <div className="absolute -top-3 -right-3 w-4 h-4 border-t-2 border-r-2 border-base-content opacity-50"></div>
            <div className="absolute -bottom-3 -left-3 w-4 h-4 border-b-2 border-l-2 border-base-content opacity-50"></div>
            <div className="absolute -bottom-3 -right-3 w-4 h-4 border-b-2 border-r-2 border-base-content opacity-50"></div>
          </div>

          <h1 className="text-3xl font-black tracking-tight uppercase font-mono flex items-center gap-1.5 text-base-content mt-2 select-none">
            <span>1757</span>
            <span className="text-primary">//</span>
            <span className="text-secondary font-extrabold">RPG</span>
          </h1>
          <p className="text-[10px] font-mono font-bold tracking-widest uppercase text-base-content/60 mt-1 select-none">
            BATTLE OF PLASSEY social deduction
          </p>
        </div>

        {/* Content Body */}
        <div className="p-8 pt-4 space-y-6">
          {/* Error Message Display */}
          {error ? (
            <div className="border-2 border-error bg-error/10 p-3 shadow-neo-sm flex items-start gap-2.5">
              <Shield size={16} className="text-error shrink-0 mt-0.5" />
              <div className="font-mono text-xs font-bold uppercase tracking-tight text-error leading-normal animate-pulse">
                {error}
              </div>
            </div>
          ) : null}

          {/* Social Provider Login: Google */}
          <button
            className="w-full btn bg-white hover:bg-zinc-100 text-black border-2 border-base-content font-mono font-bold uppercase text-xs h-12 shadow-neo-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 flex items-center justify-center"
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg className="w-5 h-5 mr-3.5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            <span>{loading ? "INITIALIZING..." : "SIGN IN WITH GOOGLE"}</span>
          </button>

          {/* Divider with diagonal stripes style */}
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-diagonal-hatch h-1 opacity-20 border-t border-b border-base-content/40"></div>
            <span className="relative bg-base-100 px-3 font-mono text-[10px] font-extrabold uppercase text-base-content/65 tracking-wider border-2 border-base-content/50 select-none">
              OR
            </span>
          </div>

          {/* Continue as Guest Button */}
          <button
            className="w-full btn btn-primary border-2 border-base-content font-mono font-bold uppercase text-xs h-12 shadow-neo-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
            type="button"
            onClick={handleGuestLogin}
            disabled={loading}
          >
            <Play size={14} className="fill-current" />
            <span>CONTINUE AS GUEST (RANDOM NICKNAME)</span>
          </button>

          {/* Decal status label */}
          <div className="text-center pt-2 font-mono text-[9px] font-bold text-base-content/40 uppercase tracking-widest select-none">
            [ SECURE ACCESS PORTAL // INITIALIZED ]
          </div>
        </div>

        {/* Diagonal Warning Stripe Footer Accent */}
        <div className="bg-diagonal-hatch h-4 border-t-4 border-base-content" />
      </div>
    </main>
  );
}
