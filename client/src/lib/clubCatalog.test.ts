import { describe, expect, it } from "vitest";
import { leagueOptions, teamsForLeague } from "./clubCatalog";

describe("catálogo dependente de liga e time", () => {
  it("oferece times principais para todas as ligas cadastradas", () => {
    expect(leagueOptions.length).toBeGreaterThan(1);
    for (const league of leagueOptions) {
      expect(teamsForLeague(league).length).toBeGreaterThan(0);
      expect(teamsForLeague(league)).toContain("Outro");
    }
  });

  it("mantém uma opção manual para liga desconhecida", () => {
    expect(teamsForLeague("Competição personalizada")).toEqual(["Outro"]);
  });
});
