import type { CityDto } from "@kerbside/shared";

/** Highest held-out R² first (stable by name on ties). */
export function rankCitiesByHeldOutR2(cities: CityDto[]): CityDto[] {
  return [...cities].sort((a, b) => {
    if (b.heldOutR2 !== a.heldOutR2) {
      return b.heldOutR2 - a.heldOutR2;
    }
    return a.name.localeCompare(b.name);
  });
}
