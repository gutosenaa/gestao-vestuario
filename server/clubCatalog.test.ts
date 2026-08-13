import { describe, expect, it } from "vitest";
import { leagueOptions, teamsForLeague } from "../client/src/lib/clubCatalog";

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

  it("preserva time legado salvo fora do catálogo atual", () => {
    const teams = teamsForLeague("Premier League", "Clube histórico removido");
    expect(teams[0]).toBe("Clube histórico removido");
    expect(teams).toContain("Outro");
  });

  it("mantém catálogo normal quando não há time salvo", () => {
    expect(teamsForLeague("La Liga")).toContain("Real Madrid");
    expect(teamsForLeague("La Liga")).not.toContain("");
  });
});
