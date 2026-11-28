"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useMusic } from "@/lib/music";
import { themeForPage } from "@/lib/preferences";
import { readPreference } from "@/lib/browser-preferences";
import { MusicControl } from "./MusicControl";

/** Persistent across navigation: music starts on entry and keeps playing through every page change. */
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
  return !inGame ? <div className="public-sound-control"><MusicControl /></div> : null;
}
