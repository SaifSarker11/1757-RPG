import Link from "next/link";
import type { ReactNode } from "react";

type PillVariant = "dark" | "cream";

interface PillLinkProps {
  href: string;
  children: ReactNode;
  /** "dark" for ink sections, "cream" for the paper sections. */
  variant?: PillVariant;
  external?: boolean;
  className?: string;
}

const VARIANTS: Record<PillVariant, { base: string; fill: string; shadow: string }> = {
  dark: {
    base: "border-white/30 text-[#F6EFE1] hover:text-[#17110B]",
    fill: "bg-[#C8A24B]",
    shadow: "hover:shadow-[0_10px_22px_rgba(0,0,0,0.45)]",
  },
  cream: {
    base: "border-[#2E2010]/50 text-[#2E2010] hover:text-[#FAE2C7]",
    fill: "bg-[#2E2010]",
    shadow: "hover:shadow-[0_10px_22px_rgba(70,48,18,0.25)]",
  },
};

/**
 * Signature pill (PestGuard reference): outline pill with a fill that sweeps
 * in from the left while the label rolls up into an identical duplicate.
 * All motion is CSS — 500ms cubic-bezier(0.16,1,0.3,1).
 */
export function PillLink({
  href,
  children,
  variant = "dark",
  external = false,
  className = "",
}: PillLinkProps) {
  const v = VARIANTS[variant];
  return (
    <Link
      href={href}
      prefetch={false}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`group relative inline-flex items-center justify-center overflow-hidden rounded-full border font-light transition-[transform,box-shadow,color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-[3px] active:scale-[0.96] ${v.base} ${v.shadow} ${className}`}
    >
      {/* fill sweep */}
      <span
        aria-hidden
        className={`absolute inset-0 origin-left scale-x-0 rounded-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100 ${v.fill}`}
      />
      {/* rolling label */}
      <span className="relative block overflow-hidden">
        <span className="block transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-full">
          {children}
        </span>
        <span
          aria-hidden
          className="absolute inset-0 block translate-y-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0"
        >
          {children}
        </span>
      </span>
    </Link>
  );
}
