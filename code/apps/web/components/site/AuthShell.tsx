import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { BATTLEFIELD_ART } from "@/lib/artwork";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <Image src={BATTLEFIELD_ART} alt="Troops, cannon crews and war elephants on the Plassey battlefield" fill unoptimized priority sizes="50vw" className="ken-burns object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-base-100 via-base-100/30 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12">
          <Link href="/" className="font-display text-5xl font-semibold">1757</Link>
          <p className="font-display mt-3 max-w-md text-2xl italic opacity-80">&ldquo;The court is full of traitors, and nobody knows who they are.&rdquo;</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="rise w-full max-w-sm">
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
