import { randomInt } from "node:crypto";

const ADJECTIVES = [
  "Bold", "Brave", "Clever", "Crafty", "Daring", "Fierce", "Gilded", "Hidden",
  "Loyal", "Noble", "Quiet", "Restless", "Shrewd", "Silent", "Swift", "Wary",
];

const NOUNS = [
  "Courier", "Diwan", "Envoy", "Falcon", "Merchant", "Munshi", "Nawab", "Scribe",
  "Sepoy", "Sowar", "Spy", "Tiger", "Trader", "Vizier", "Wazir", "Zamindar",
];

const pick = <T>(items: readonly T[]): T => items[randomInt(items.length)]!;

/** A random display name for a guest, e.g. "Swift Sepoy 42". */
export function generateGuestName(): string {
  return `${pick(ADJECTIVES)} ${pick(NOUNS)} ${randomInt(10, 100)}`;
}
