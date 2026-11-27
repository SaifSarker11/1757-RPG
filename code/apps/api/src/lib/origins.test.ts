import { describe, expect, it } from "vitest";
import { allowedOrigins, isAllowedOrigin, matchesOrigin } from "./origins.js";

describe("origin policy", () => {
  it("accepts the game's own deployed origins", () => {
    expect(isAllowedOrigin("https://1757-web-rpg.vercel.app")).toBe(true);
    expect(isAllowedOrigin("https://1757-admin-rpg.vercel.app")).toBe(true);
    expect(isAllowedOrigin("https://one757-web.onrender.com")).toBe(true);
  });

  it("accepts every preview URL of the owner's Vercel team", () => {
    expect(
      isAllowedOrigin("https://1757-web-git-main-saifsarker11s-projects.vercel.app")
    ).toBe(true);
  });

  it("rejects someone else's site on the same hosting platforms", () => {
    expect(isAllowedOrigin("https://phisher.onrender.com")).toBe(false);
    expect(isAllowedOrigin("https://phisher.vercel.app")).toBe(false);
    expect(isAllowedOrigin("https://evil.example.com")).toBe(false);
  });

  it("keeps the wildcard inside one DNS label", () => {
    expect(
      matchesOrigin(
        "https://*-saifsarker11s-projects.vercel.app",
        "https://abc-saifsarker11s-projects.vercel.app"
      )
    ).toBe(true);
    expect(
      matchesOrigin(
        "https://*-saifsarker11s-projects.vercel.app",
        "https://abc.evil-saifsarker11s-projects.vercel.app"
      )
    ).toBe(false);
  });

  it("lets non-browser clients through, since they send no origin", () => {
    expect(isAllowedOrigin(undefined)).toBe(true);
  });

  it("never lists a bare platform wildcard", () => {
    expect(allowedOrigins.some((o) => o === "https://*.vercel.app")).toBe(false);
    expect(allowedOrigins.some((o) => o === "https://*.onrender.com")).toBe(false);
  });
});
