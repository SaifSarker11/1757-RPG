import Link from "next/link";
import type { ReactNode } from "react";

type PillVariant = "primary" | "surface" | "dark";

interface PillLinkProps {
  href: string;
  children: ReactNode;
  /** "primary" orange fill, "surface" white card, "dark" for night panels. */
  variant?: PillVariant;
  external?: boolean;
  className?: string;
}

const VARIANTS: Record<PillVariant, string> = {
  primary:
    "bg-[#ff5206] text-white hover:bg-[#e84700] hover:shadow-[0_8px_20px_-6px_rgba(255,82,6,0.55)]",
  surface:
    "border border-[#e6e6e4] bg-white text-[#111] hover:bg-[#f4f4f3] hover:border-[#d4d4d1]",
  dark: "border border-white/15 bg-white/10 text-white hover:bg-white/15",
};

/**
 * Supply button style: solid pill, quick clean transitions, subtle press.
 * No sweeps or rolls — the marketplace keeps its buttons calm and precise.
 */
export function PillLink({
  href,
  children,
  variant = "primary",
  external = false,
  className = "",
}: PillLinkProps) {
  return (
    <Link
      href={href}
      prefetch={false}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`inline-flex items-center justify-center rounded-full font-medium transition-all duration-300 hover:-translate-y-[1px] active:scale-[0.97] ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
