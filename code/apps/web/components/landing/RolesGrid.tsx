import { Reveal } from "./Reveal";
import { fontMono, fontSans, ui } from "./fonts";

const GREEN_ROLES = [
  "Nawab Siraj ud-Daulah",
  "Lutfunnesa",
  "Mir Madan",
  "Mohon Lal",
  "Saint Frais",
  "de Bussy",
  "Raja Ramnarain",
  "Loyalist",
];

const RED_ROLES = [
  "Mir Jafar",
  "Umichad",
  "Jean Law",
  "Ghasheti Begum",
  "Yar Lutuf",
  "Tara Bai",
  "Rai Durlabh",
  "EIC Spy",
];

const COLUMNS = [
  {
    title: "The Loyalists",
    roles: GREEN_ROLES,
    accent: "#1f6b3f",
    wash: "#eaf5ee",
    note: "Fillers join when a side needs numbers.",
  },
  {
    title: "The Conspirators",
    roles: RED_ROLES,
    accent: "#a8291b",
    wash: "#fdeeec",
    note: "Most named roles carry their own hidden power.",
  },
];

export function RolesGrid() {
  return (
    <section id="roles" className="w-full py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <p className={`${ui.label} mb-4`} style={fontMono}>
            The Roles
          </p>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2
              className="max-w-2xl text-[32px] font-medium leading-[1.12] tracking-[-0.02em] text-[#111] md:text-[44px]"
              style={fontSans}
            >
              Fifteen seats{" "}
              <span className="text-[#ff5206]">at the table.</span>
            </h2>
            <span
              className="rounded-full border border-[#e6e6e4] bg-white px-3.5 py-1.5 text-[11px] uppercase tracking-[0.14em] text-[#5c5c5c]"
              style={fontMono}
            >
              16 named roles match the court
            </span>
          </div>
          <p
            className="mt-4 max-w-xl text-[15px] font-light leading-relaxed text-[#5c5c5c]"
            style={fontSans}
          >
            Every player is dealt a named historical role — each with its own
            power, knowledge or grudge. Royal Decree mode lets the host choose
            exactly which characters are allowed in.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {COLUMNS.map((column, i) => (
            <Reveal key={column.title} delay={i * 100}>
              <div className={`${ui.card} ${ui.cardHover} h-full p-8`} style={fontSans}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className="h-2 w-2 rounded-full"
                      style={{ background: column.accent }}
                    />
                    <h3 className="text-[22px] font-medium leading-tight tracking-[-0.02em] text-[#111]" style={fontSans}>
                      {column.title}
                    </h3>
                  </div>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.08em]"
                    style={{ background: column.wash, color: column.accent, ...fontMono }}
                  >
                    {column.roles.length} roles
                  </span>
                </div>
                <ul className="mt-6 flex flex-wrap gap-2">
                  {column.roles.map((role) => (
                    <li
                      key={role}
                      className="rounded-full border border-[#e6e6e4] bg-[#f8f8f8] px-4 py-2 text-[13px] font-normal text-[#111] transition-colors duration-200 hover:border-[#d4d4d1] hover:bg-[#f4f4f3]"
                      style={fontSans}
                    >
                      {role}
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-[13px] font-light text-[#8a8a8a]" style={fontSans}>
                  {column.note}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Royal Decree banner — Supply accent wash */}
        <Reveal delay={160}>
          <div
            className="mt-4 flex flex-col items-start justify-between gap-4 rounded-[18px] border border-[#ffd4c2] bg-[#fff2ec] p-8 md:flex-row md:items-center"
            style={fontSans}
          >
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[#c53a00]"
                style={fontMono}
              >
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[#ff5206]" />
                Royal Decree ready
              </span>
              <span className="text-[20px] font-medium tracking-[-0.01em] text-[#111]" style={fontSans}>
                Custom courts
              </span>
            </div>
            <p className="max-w-md text-[14px] font-light leading-relaxed text-[#5c5c5c]" style={fontSans}>
              The host picks exactly which characters are dealt — ban Mir Jafar,
              stack the court, or run the full 17-role deck. Your table, your
              rules.
            </p>
          </div>
        </Reveal>

        {/* Jagat Seth strip */}
        <Reveal delay={200}>
          <div className={`${ui.card} mt-4 flex flex-col items-start justify-between gap-4 p-8 md:flex-row md:items-center`} style={fontSans}>
            <div className="flex flex-wrap items-center gap-3">
              <span aria-hidden className="h-2 w-2 rounded-full bg-[#8a5a00]" />
              <span className="text-[20px] font-medium tracking-[-0.01em] text-[#111]" style={fontSans}>
                Jagat Seth
              </span>
              <span
                className="rounded-full border border-[#e6e6e4] bg-[#fdf4e3] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[#8a5a00]"
                style={fontMono}
              >
                Wins alone
              </span>
            </div>
            <p className="max-w-md text-[14px] font-light leading-relaxed text-[#5c5c5c]" style={fontSans}>
              The neutral banker. In the endgame he names Mir Jafar or Rai
              Durlabh — a correct guess takes the entire game for himself.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
