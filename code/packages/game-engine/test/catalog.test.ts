import { describe, expect, it } from "vitest";
import { ALL_NAMED_ROLES } from "../src/config/gameConfig.js";
import { ROLE_CATALOG, dependencyClosure, teamOf } from "../src/roles/catalog.js";

describe("ROLE_CATALOG", () => {
  it("has 7 Green, 7 Red and 1 Gold named role", () => {
    const teams = ALL_NAMED_ROLES.map(teamOf);
    expect(teams.filter((t) => t === "GREEN")).toHaveLength(7);
    expect(teams.filter((t) => t === "RED")).toHaveLength(7);
    expect(teams.filter((t) => t === "GOLD")).toHaveLength(1);
  });

  it("puts Raja Ramnarain on Green", () => {
    expect(ROLE_CATALOG.RAJA_RAMNARAIN.team).toBe("GREEN");
  });

  it("puts the fillers on Green and Red", () => {
    expect(teamOf("LOYALIST")).toBe("GREEN");
    expect(teamOf("EIC_SPY")).toBe("RED");
  });
});

describe("dependencyClosure", () => {
  it("links Mir Jafar and Mir Madan both ways", () => {
    expect(dependencyClosure("MIR_JAFAR").sort()).toEqual(["MIR_JAFAR", "MIR_MADAN"]);
    expect(dependencyClosure("MIR_MADAN").sort()).toEqual(["MIR_JAFAR", "MIR_MADAN"]);
  });

  it("pulls in Mir Madan, Mir Jafar and Ghasheti Begum for Mohon Lal", () => {
    expect(dependencyClosure("MOHON_LAL").sort()).toEqual(
      ["GHASHETI_BEGUM", "MIR_JAFAR", "MIR_MADAN", "MOHON_LAL"].sort()
    );
  });

  it("pulls in Siraj and Lutfunnesa for Tara Bai", () => {
    expect(dependencyClosure("TARA_BAI").sort()).toEqual(
      ["LUTFUNNESA", "NAWAB_SIRAJ", "TARA_BAI"].sort()
    );
  });

  it("pulls in Mir Jafar, Mir Madan and Rai Durlabh for Jagat Seth", () => {
    expect(dependencyClosure("JAGAT_SETH").sort()).toEqual(
      ["JAGAT_SETH", "MIR_JAFAR", "MIR_MADAN", "RAI_DURLABH"].sort()
    );
  });

  it("is just the role for roles without dependencies", () => {
    expect(dependencyClosure("DE_BUSSY")).toEqual(["DE_BUSSY"]);
  });
});
