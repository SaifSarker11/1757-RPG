/** Public-facing copy for the court. Mirrors packages/game-engine/src/roles/catalog.ts. */
export type Faction = "GREEN" | "RED" | "GOLD";

export interface CourtRole {
  id: string;
  name: string;
  team: Faction;
  title: string;
  power: string;
  requires?: string[];
  portrait?: string;
}

export const COURT: CourtRole[] = [
  { id: "NAWAB_SIRAJ", name: "Nawab Siraj ud-Daulah", team: "GREEN", title: "The Nawab of Bengal", power: "Sees Lutfunnesa. If Tara Bai is dealt, he sees two Lutfunnesas and must guess which is real.", portrait: "/images/roles/siraj.jpg" },
  { id: "LUTFUNNESA", name: "Lutfunnesa", team: "GREEN", title: "The Begum", power: "Sees the Nawab. If Tara Bai is dealt, she sees two Nawabs and must guess which is real.", portrait: "/images/roles/lutfunnesa.jpg" },
  { id: "MIR_MADAN", name: "Mir Madan", team: "GREEN", title: "Commander of Artillery", power: "Sees the Red conspirators (except Rai Durlabh) during the first discussion. Mir Jafar hunts him in the endgame.", requires: ["Mir Jafar"], portrait: "/images/roles/mirmadan.jpg" },
  { id: "MOHON_LAL", name: "Mohon Lal", team: "GREEN", title: "The Diwan", power: "Sees Mir Madan and Ghasheti Begum as two unnamed spies — one friend, one foe.", requires: ["Mir Madan", "Ghasheti Begum"], portrait: "/images/roles/mohonlal.jpg" },
  { id: "SAINT_FRASY", name: "Saint Frais", team: "GREEN", title: "French Gunner", power: "His ballot and mission votes count double.", portrait: "/images/roles/saintfrais.jpg" },
  { id: "DE_BUSSY", name: "de Bussy", team: "GREEN", title: "French General", power: "Once per game, locks onto a player: both of you see each other's role.", portrait: "/images/roles/debussy.jpg" },
  { id: "RAJA_RAMNARAIN", name: "Raja Ramnarain", team: "GREEN", title: "Governor of Patna", power: "Sees the Nawab for the whole game.", portrait: "/images/roles/ramnarain.jpg" },
  { id: "MIR_JAFAR", name: "Mir Jafar", team: "RED", title: "Leader of the Conspiracy", power: "If the Loyalists win three rounds, he gets one guess: name Mir Madan and Red steals the game.", requires: ["Mir Madan"], portrait: "/images/roles/mirjafar.jpg" },
  { id: "UMICHAD", name: "Umichad", team: "RED", title: "The Lone Merchant", power: "A lone wolf — he doesn't know who his fellow conspirators are.", portrait: "/images/roles/umichad.jpg" },
  { id: "JEAN_LAW", name: "Jean Law", team: "RED", title: "The French Agent", power: "Once per game, curses a player. A cursed Loyalist wins only if Red wins.", portrait: "/images/roles/jeanlaw.jpg" },
  { id: "GHASHETI_BEGUM", name: "Ghasheti Begum", team: "RED", title: "The Aunt", power: "Appears to Mohon Lal beside Mir Madan, muddying his vision.", portrait: "/images/roles/ghasheti.jpg" },
  { id: "YAR_LUTUF", name: "Yar Lutuf", team: "RED", title: "The Defector", power: "His ballot and mission votes count double.", portrait: "/images/roles/yarlutuf.jpg" },
  { id: "TARA_BAI", name: "Tara Bai", team: "RED", title: "The Impostor", power: "Poses as the Nawab's and the Begum's partner, confusing them both.", requires: ["Nawab Siraj ud-Daulah", "Lutfunnesa"], portrait: "/images/roles/tarabai.jpg" },
  { id: "RAI_DURLABH", name: "Rai Durlabh", team: "RED", title: "The Silent General", power: "Invisible to every vision power — only de Bussy's lock can reveal him.", portrait: "/images/roles/raidurlabh.jpg" },
  { id: "ROBERT_CLIVE", name: "Robert Clive", team: "RED", title: "Commander of the Company", power: "Leads the East India Company's army. Knows his fellow conspirators, and his ballot vote counts double.", portrait: "/images/roles/robertclive.jpg" },
  { id: "JAGAT_SETH", name: "Jagat Seth", team: "GOLD", title: "The Banker of the World", power: "Dealt at 9+ players. In the endgame he names Mir Jafar (if Green leads) or Rai Durlabh (if Red leads). Right, and he wins alone.", requires: ["Mir Jafar", "Rai Durlabh"], portrait: "/images/roles/jagatseth.jpg" },
  { id: "LOYALIST", name: "Loyalist", team: "GREEN", title: "Filler", power: "No power — only your judgement. Fills Green seats.", portrait: "/images/roles/loyalist.jpg" },
  { id: "EIC_SPY", name: "EIC Spy", team: "RED", title: "Filler", power: "Knows the other spies. Fills Red seats.", portrait: "/images/roles/eicspy.jpg" },
];

export const FACTION_META: Record<Faction, { label: string; short: string; text: string; tone: string }> = {
  GREEN: { label: "The Nawab's Loyalists", short: "Loyalists", text: "The majority — and the blind. They hold the court but can't see each other. Win three missions and Bengal stays free.", tone: "text-loyal" },
  RED: { label: "The Company's Conspirators", short: "Conspirators", text: "The minority — and the informed. Most know each other. One Sabotage card can bring down a mission.", tone: "text-traitor" },
  GOLD: { label: "Jagat Seth", short: "Neutral", text: "Not a faction. The banker plays both sides, and a single correct guess makes him the only winner.", tone: "text-banker" },
};

export const ROUND_STEPS = [
  { n: "01", title: "Role reveal", text: "You see your secret role and whatever it lets you know about others." },
  { n: "02", title: "Discussion", text: "Talk, accuse, bluff. The host sets the timer from 30 to 300 seconds." },
  { n: "03", title: "Selection", text: "The Leader picks ministers for the mission. Teams grow each round." },
  { n: "04", title: "Ballot", text: "Everyone votes. Ties reject, leadership rotates, and five rejections give the round to Red." },
  { n: "05", title: "Mission", text: "Ministers secretly play Success or Sabotage. One Sabotage fails the round." },
  { n: "06", title: "Result", text: "Cards are shuffled before the reveal — nobody knows who betrayed the court." },
];

export const TEAM_SIZES: Record<number, number[]> = {
  6: [2, 3, 4, 3, 4], 7: [2, 3, 3, 4, 4], 8: [3, 4, 4, 5, 5], 9: [3, 4, 4, 5, 5], 10: [3, 4, 4, 5, 5],
  11: [3, 4, 5, 6, 6], 12: [3, 4, 5, 6, 6], 13: [4, 5, 5, 6, 7], 14: [4, 5, 5, 6, 7], 15: [4, 5, 6, 6, 7],
};

/** Green / Red / Gold seats per player count (engine COMPOSITION). */
export const SEATS: Record<number, [number, number, number]> = {
  6: [4, 2, 0], 7: [4, 3, 0], 8: [5, 3, 0], 9: [5, 3, 1], 10: [5, 4, 1],
  11: [6, 4, 1], 12: [6, 5, 1], 13: [7, 5, 1], 14: [7, 6, 1], 15: [7, 7, 1],
};
