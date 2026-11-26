import { Reveal } from "./Reveal";
import { fontBody, fontDisplay } from "./fonts";

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
    accent: "#456B31",
    note: "Fillers join when a side needs numbers.",
  },
  {
    title: "The Conspirators",
    roles: RED_ROLES,
    accent: "#93372A",
    note: "Most named roles carry their own hidden power.",
  },
];

export function RolesGrid() {
  return (
    <section id="roles" className="w-full bg-[#FAE2C7] pb-24 md:pb-32">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <p
            className="mb-4 text-[12px] font-medium uppercase tracking-[0.3em] text-[#B08A3C]"
            style={fontBody}
          >
            The Roles
          </p>
          <h2
            className="max-w-2xl text-4xl leading-[1.1] text-[#2E2010] md:text-5xl"
            style={fontDisplay}
          >
            Fifteen seats{" "}
            <span className="italic text-[#B08A3C]">at the table.</span>
          </h2>
          <p
            className="mt-4 max-w-xl text-[15px] font-light leading-relaxed text-[#2E2010]/70"
            style={fontBody}
          >
            Every player is dealt a named historical role — each with its own
            power, knowledge or grudge. Royal Decree mode lets the host choose
            exactly which characters are allowed in.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {COLUMNS.map((column, i) => (
            <Reveal key={column.title} delay={i * 140}>
              <div className="h-full rounded-3xl border border-[#2E2010]/10 bg-[#FFF6E6]/80 p-8">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: column.accent }}
                  />
                  <h3
                    className="text-[26px] leading-tight text-[#2E2010]"
                    style={fontDisplay}
                  >
                    {column.title}
                  </h3>
                </div>
                <ul className="mt-6 flex flex-wrap gap-2.5">
                  {column.roles.map((role) => (
                    <li
                      key={role}
                      className="rounded-full border border-[#2E2010]/15 px-4 py-2 text-[14px] font-light text-[#2E2010]/85 transition-colors duration-300 hover:border-[#2E2010]/40 hover:bg-[#2E2010]/5"
                      style={fontBody}
                    >
                      {role}
                    </li>
                  ))}
                </ul>
                <p
                  className="mt-6 text-[13px] font-light italic text-[#2E2010]/55"
                  style={fontBody}
                >
                  {column.note}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Jagat Seth strip */}
        <Reveal delay={200}>
          <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-3xl border border-[#B08A3C]/35 bg-[#FFF6E6]/60 p-8 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-[#B08A3C]" />
              <span
                className="text-[24px] leading-tight text-[#2E2010]"
                style={fontDisplay}
              >
                Jagat Seth
              </span>
              <span
                className="rounded-full border border-[#B08A3C]/50 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-[#B08A3C]"
                style={fontBody}
              >
                Wins alone
              </span>
            </div>
            <p
              className="max-w-md text-[14px] font-light leading-relaxed text-[#2E2010]/70"
              style={fontBody}
            >
              The neutral banker. In the endgame he names Mir Jafar or Rai
              Durlabh — a correct guess takes the entire game for himself.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
