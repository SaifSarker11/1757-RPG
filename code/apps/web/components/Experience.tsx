"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { gameAudio } from "@/lib/audio";
import { useMusic } from "@/lib/music";
import { themeForPage } from "@/lib/preferences";
import { readPreference } from "@/lib/browser-preferences";
import { MusicControl } from "./MusicControl";

/** Persistent across navigation: music starts on entry, clicks cover every control. */
export function Experience() {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  useMusic();
  const inGame = pathname === "/home" || pathname.startsWith("/room/");
  useEffect(() => {
    const apply = () => document.documentElement.setAttribute("data-theme", themeForPage(readPreference("daisyui-theme"), Boolean(session?.user), pathname));
    apply(); window.addEventListener("1757-theme-change", apply);
    return () => window.removeEventListener("1757-theme-change", apply);
  }, [pathname, session?.user?.id]);
  useEffect(() => {
    const click = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('[data-sfx="off"]')) return;
      const control = target.closest('button,a[href],[role="button"],[role="radio"],summary,select,input[type="checkbox"],input[type="radio"]');
      if (!control || control.matches(':disabled,[aria-disabled="true"]')) return;
      gameAudio.playClick();
    };
    document.addEventListener("click", click, true);
    const change = (event: Event) => { if (event.target instanceof HTMLSelectElement) gameAudio.playClick(); };
    document.addEventListener("change", change, true);
    return () => { document.removeEventListener("click", click, true); document.removeEventListener("change", change, true); };
  }, []);
  return !inGame ? <div className="public-sound-control"><MusicControl /></div> : null;
}
