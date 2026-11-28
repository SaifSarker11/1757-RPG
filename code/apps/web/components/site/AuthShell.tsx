import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { AUTH_BATTLEFIELD_ART } from "@/lib/artwork";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <main className="auth-scene">
      <Image src={AUTH_BATTLEFIELD_ART} alt="The Plassey battlefield beneath a fiery sunset, with war elephants and cavalry" fill unoptimized priority sizes="100vw" className="auth-background ken-burns object-cover" />
      <div className="auth-shade" aria-hidden="true" />
      <div className="auth-identity">
          <Link href="/" className="font-display text-5xl font-semibold">1757</Link>
          <p className="font-display mt-3 max-w-md text-2xl italic opacity-80">&ldquo;The court is full of traitors, and nobody knows who they are.&rdquo;</p>
      </div>
      <div className="auth-content">
        <div className="rise w-full">
          <Link href="/" className="font-display text-3xl font-semibold lg:hidden">1757</Link>
          <p className="eyebrow mt-6 lg:mt-0">Plassey · 1757</p>
          <h1 className="font-display mt-3 text-5xl font-semibold">{title}</h1>
          <p className="mt-2 opacity-60">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-8 text-center text-sm opacity-70">{footer}</div>
        </div>
      </div>
    </main>
  );
}

export function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      <input {...rest} className="input input-bordered mt-2 w-full rounded-xl bg-base-200" />
    </label>
  );
}
