import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="hairline relative mt-24 border-t">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <p className="font-display text-5xl font-semibold">1757</p>
          <p className="mt-3 max-w-xs text-sm opacity-60">
            A real-time social-deduction game set in the Nawab&apos;s court on the eve of Plassey.
          </p>
        </div>
        <FooterCol title="Play" links={[["Start a game", "/login"], ["Create account", "/signup"], ["Lobby", "/home"]]} />
        <FooterCol title="Learn" links={[["How to play", "/#how"], ["Full rules", "/rules"], ["Characters", "/characters"]]} />
        <FooterCol title="Project" links={[["Source on GitHub", "https://github.com/SaifSarker11/1757-RPG"], ["Music credits", "/music/CREDITS.md"]]} />
      </div>
      <div className="hairline mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t px-6 py-6 text-xs opacity-50">
        <span>SWE 4404 · Islamic University of Technology</span>
        <span>Bengal, 23 June 1757</span>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="eyebrow mb-4">{title}</p>
      <ul className="space-y-2.5 text-sm">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="opacity-70 transition-opacity hover:opacity-100">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
