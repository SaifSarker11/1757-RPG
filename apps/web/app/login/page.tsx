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
        callbackURL: `${window.location.origin}/home`,
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
    <main className="relative flex min-h-screen items-center justify-center bg-grid-pattern bg-base-200 text-base-content p-6 scanlines font-tech overflow-hidden select-none">
      {/* Decorative Technical Vector/HUD lines */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        {/* Corner coordinates */}
        <div className="absolute top-8 left-8 text-xs font-bold text-base-content/50">
          SYS_LOC: [23.8103° N, 90.4125° E]
        </div>
        <div className="absolute top-8 right-8 text-xs font-bold text-base-content/50 text-right">
          SYS_TIME: {new Date().getFullYear()}-06-17 // ONLINE
        </div>
        <div className="absolute bottom-8 left-8 text-xs font-bold text-base-content/50">
          SECURE_NODE: TCP // PORT_3001
        </div>
        <div className="absolute bottom-8 right-8 text-xs font-bold text-base-content/50 text-right">
          VECTORHEART_PROTO: ACTIVE
        </div>

        {/* Diagonal wireframe crosshairs */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <line x1="0" y1="0" x2="100%" y2="100%" stroke="currentColor" strokeWidth="0.5" strokeDasharray="5,5" />
          <line x1="100%" y1="0" x2="0" y2="100%" stroke="currentColor" strokeWidth="0.5" strokeDasharray="5,5" />
          {/* Centered target square */}
          <rect x="calc(50% - 250px)" y="calc(50% - 250px)" width="500" height="500" fill="none" stroke="currentColor" strokeWidth="0.75" strokeDasharray="10,10" />
          <circle cx="50%" cy="50%" r="300" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,8" />
        </svg>
      </div>

      {/* Main Tech/Vectorheart Login Card */}
      <div className="w-full max-w-md bg-base-100 border-2 border-base-content relative transition-all z-10 shadow-neo">
        {/* Tech Corner Angle Brackets on Card */}
        <div className="absolute -top-1.5 -left-1.5 w-6 h-6 border-t-4 border-l-4 border-primary"></div>
        <div className="absolute -top-1.5 -right-1.5 w-6 h-6 border-t-4 border-r-4 border-primary"></div>
        <div className="absolute -bottom-1.5 -left-1.5 w-6 h-6 border-b-4 border-l-4 border-secondary"></div>
        <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 border-b-4 border-r-4 border-secondary"></div>

        {/* Diagonal Warning Stripe Header Accent */}
        <div className="bg-diagonal-hatch h-8 border-b-2 border-base-content flex items-center justify-between px-4 text-xs font-bold tracking-wider text-base-content">
          <span>PORTAL_LOCKOUT: SECURE_ENTRY</span>
          <span className="text-primary font-black">SYS_V2.0.4</span>
        </div>

        <div className="p-8 pb-4 flex flex-col items-center text-center">
          {/* Advanced Y2K Polashi Vectorheart Logo with Rotating Radar Rings */}
          <div className="relative mb-6 mt-4 group">
            {/* Outer rotating technical coordinate circle */}
            <svg
              viewBox="0 0 120 120"
              className="w-32 h-32 text-base-content pointer-events-none"
            >
              {/* Rotating radar elements */}
              <g className="origin-[60px_60px] animate-radar">
                <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4,12" className="opacity-40" />
                <circle cx="60" cy="60" r="46" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="40,20" className="text-secondary opacity-60" />
                {/* Tick markers */}
                <line x1="60" y1="6" x2="60" y2="12" stroke="currentColor" strokeWidth="2" />
                <line x1="60" y1="108" x2="60" y2="114" stroke="currentColor" strokeWidth="2" />
                <line x1="6" y1="60" x2="12" y2="60" stroke="currentColor" strokeWidth="2" />
                <line x1="108" y1="60" x2="114" y2="60" stroke="currentColor" strokeWidth="2" />
              </g>
              
              {/* Static target overlay */}
              <circle cx="60" cy="60" r="38" fill="none" stroke="currentColor" strokeWidth="0.5" className="opacity-25" />
              <line x1="60" y1="18" x2="60" y2="102" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" className="opacity-30" />
              <line x1="18" y1="60" x2="102" y2="60" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" className="opacity-30" />

              {/* Crossed Battle Sabres (Depicting Plassey/Polashi Battle & Card Duel) */}
              <g stroke="currentColor" strokeWidth="2.5" className="text-base-content opacity-40">
                {/* Sabre 1 (Bottom-Left to Top-Right) */}
                <line x1="28" y1="92" x2="88" y2="32" strokeLinecap="square" />
                <line x1="22" y1="94" x2="34" y2="82" />
                <circle cx="20" cy="96" r="2.5" fill="currentColor" />

                {/* Sabre 2 (Bottom-Right to Top-Left) */}
                <line x1="92" y1="92" x2="32" y2="32" strokeLinecap="square" />
                <line x1="98" y1="94" x2="86" y2="82" />
                <circle cx="100" cy="96" r="2.5" fill="currentColor" />
              </g>

              {/* Outer Y2K Vectorheart (Depicting Card Hearts / Spades) */}
              <polygon
                points="60,38 42,22 24,36 24,56 60,92 96,56 96,36 78,22"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
                className="text-error"
              />

              {/* Inner Palash Flower Petal (The Flame of Polashi / Central Card Suit) */}
              <polygon
                points="60,44 46,58 60,80 74,58"
                fill="currentColor"
                className="text-primary opacity-20"
              />
              <polygon
                points="60,44 46,58 60,80 74,58"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-primary"
              />
              {/* Petal Rib lines */}
              <line x1="60" y1="80" x2="60" y2="44" stroke="currentColor" strokeWidth="2" className="text-primary" />
              <line x1="60" y1="68" x2="52" y2="60" stroke="currentColor" strokeWidth="1.5" className="text-primary" />
              <line x1="60" y1="68" x2="68" y2="60" stroke="currentColor" strokeWidth="1.5" className="text-primary" />

              {/* Central Pivot Jewel / Heart Core */}
              <polygon points="60,57 63,60 60,63 57,60" fill="currentColor" className="text-secondary" />

              {/* Y2K Starburst Sparkles */}
              <path d="M 20 20 Q 20 25 15 25 Q 20 25 20 30 Q 20 25 25 25 Q 20 25 20 20 Z" fill="currentColor" className="text-accent" />
              <path d="M 100 20 Q 100 25 95 25 Q 100 25 100 30 Q 100 25 105 25 Q 100 25 100 20 Z" fill="currentColor" className="text-accent" />
            </svg>
            
            {/* HUD Angle corner brackets around SVG */}
            <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-primary"></div>
            <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-primary"></div>
            <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-secondary"></div>
            <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-secondary"></div>
          </div>

          <h1 className="text-3xl font-black tracking-tighter uppercase flex items-center gap-1 mt-2">
            <span>1757</span>
            <span className="text-primary animate-pulse">//</span>
            <span className="text-secondary">RPG</span>
          </h1>
          <p className="text-xs font-bold tracking-widest text-base-content/60 mt-1">
            BATTLE OF PLASSEY: MULTIPLAYER NODE
          </p>
        </div>

        {/* Content Body */}
        <div className="p-8 pt-4 space-y-6">
          {/* Error Message Display */}
          {error ? (
            <div className="border border-error bg-error/15 p-3 flex items-start gap-2.5 relative">
              <div className="absolute top-0 right-0 bg-error text-error-content text-[8px] font-black px-1 py-0.5">ERR</div>
              <Shield size={16} className="text-error shrink-0 mt-0.5" />
              <div className="text-xs font-bold uppercase tracking-tight text-error leading-normal">
                {error}
              </div>
            </div>
          ) : null}

          {/* Social Provider Login: Google */}
          <button
            className="w-full btn bg-white hover:bg-zinc-100 text-black border-2 border-base-content font-bold uppercase text-xs h-12 shadow-neo-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 flex items-center justify-center cursor-pointer"
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
            <span>{loading ? "INITIALIZING SECURE LINK..." : "AUTHORIZE VIA GOOGLE"}</span>
          </button>

          {/* Divider with diagonal stripes style */}
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-diagonal-hatch h-1 opacity-40 border-t border-b border-base-content/40"></div>
            <span className="relative bg-base-100 px-3 text-[10px] font-extrabold uppercase text-base-content/65 tracking-wider border-2 border-base-content/50">
              OR
            </span>
          </div>

          {/* Continue as Guest Button */}
          <button
            className="w-full btn btn-primary border-2 border-base-content font-bold uppercase text-xs h-12 shadow-neo-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 cursor-pointer"
            type="button"
            onClick={handleGuestLogin}
            disabled={loading}
          >
            <Play size={14} className="fill-current" />
            <span>GENERATE GUEST CREDENTIALS</span>
          </button>

          {/* Decal status label */}
          <div className="text-center pt-2 text-[9px] font-bold text-base-content/40 uppercase tracking-widest">
            [ SECURE ACCESS PORTAL // ACTIVE_LOBBY ]
          </div>
        </div>

        {/* Diagonal Warning Stripe Footer Accent */}
        <div className="bg-diagonal-hatch h-4 border-t-2 border-base-content" />
      </div>
    </main>
  );
}
