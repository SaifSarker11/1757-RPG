import { randomInt } from "node:crypto";

export const ROOM_CODE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
export const ROOM_CODE_LENGTH = 6;
const ROOM_CODE_PATTERN = /^[A-Z0-9]{6}$/;
const MAX_ATTEMPTS = 10;

/** A random 6-character code from A–Z0–9 (36^6 ≈ 2.2 billion codes). */
export function generateRoomCode(nextInt: (max: number) => number = randomInt): string {
  let code = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_ALPHABET[nextInt(ROOM_CODE_ALPHABET.length)];
  }
  return code;
}

/** Upper-cases and trims user input; null if it can't be a room code. */
export function normalizeRoomCode(input: string): string | null {
  const code = input.trim().toUpperCase();
  return ROOM_CODE_PATTERN.test(code) ? code : null;
}

export async function generateUniqueRoomCode(
  isTaken: (code: string) => Promise<boolean>,
  nextInt?: (max: number) => number
): Promise<string> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const code = generateRoomCode(nextInt);
    if (!(await isTaken(code))) return code;
  }
  throw new Error(`No free room code after ${MAX_ATTEMPTS} attempts`);
}
