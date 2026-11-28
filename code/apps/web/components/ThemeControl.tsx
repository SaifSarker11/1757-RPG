"use client";
import { useEffect, useRef, useState } from "react";
import { THEMES, validTheme, type ThemeId } from "@/lib/preferences";
import { readPreference, writePreference } from "@/lib/browser-preferences";
export function ThemeControl() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [current, setCurrent] = useState<ThemeId>("plassey");
  useEffect(() => setCurrent(validTheme(readPreference("daisyui-theme"))), []);
  function choose(id: ThemeId) {
    setCurrent(id); writePreference("daisyui-theme", id);
    document.documentElement.setAttribute("data-theme", id);
    window.dispatchEvent(new Event("1757-theme-change"));
  }
  return <>
    <button type="button" className="btn btn-outline btn-sm font-mono" onClick={() => dialog.current?.showModal()} aria-label="Choose theme" title="Choose theme"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18Z" fill="currentColor"/></svg>Theme</button>
    <dialog ref={dialog} className="modal" aria-labelledby="theme-title" onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}><div className="modal-box preference-panel">
      <div className="flex justify-between items-center gap-3 mb-5"><h2 id="theme-title" className="font-display text-2xl">Your court, your colours</h2><button type="button" className="btn btn-ghost btn-square btn-sm" aria-label="Close theme picker" onClick={() => dialog.current?.close()}>×</button></div>
      <div role="radiogroup" aria-label="Game theme" className="space-y-2">{THEMES.map((theme) => <button key={theme.id} type="button" role="radio" aria-checked={current === theme.id} onClick={() => choose(theme.id)} className={`theme-choice theme-preview-${theme.id} btn btn-outline w-full justify-between h-auto py-3 ${current === theme.id ? "border-primary" : "border-base-content/20"}`}>
        <span className="flex items-center gap-3"><span className="theme-swatches" aria-hidden="true"><i/><i/><i/><i/></span><span className="text-sm font-sans">{theme.name}</span></span><span aria-hidden="true">{current === theme.id ? "●" : "○"}</span>
      </button>)}</div>
    </div></dialog>
  </>;
}
