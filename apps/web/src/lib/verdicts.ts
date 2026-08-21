import type { VerdictDto, VerdictKind } from "@kerbside/shared";
import { STUDY_CITIES } from "@kerbside/shared";

export const VERDICT_ORDER = [
  "proven",
  "suggestive",
  "city_specific",
  "withdrawn",
  "disproven",
  "harmful",
  "untested",
] as const satisfies readonly VerdictKind[];

export type GroupedVerdicts = Record<VerdictKind, VerdictDto[]>;

export function groupVerdicts(verdicts: VerdictDto[]): GroupedVerdicts {
  const grouped: GroupedVerdicts = {
    proven: [],
    suggestive: [],
    city_specific: [],
    withdrawn: [],
    disproven: [],
    harmful: [],
    untested: [],
  };

  for (const verdict of verdicts) {
    grouped[verdict.verdict].push(verdict);
  }

  return grouped;
}

export function formatSignedR2(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "—";
  }
  const rounded = value.toFixed(3);
  return value >= 0 ? `+${rounded}` : rounded;
}

export function badgeVariantForVerdict(
  verdict: VerdictKind,
): "default" | "destructive" | "secondary" | "outline" {
  if (verdict === "proven") {
    return "default";
  }
  if (verdict === "disproven" || verdict === "harmful") {
    return "destructive";
  }
  if (
    verdict === "withdrawn" ||
    verdict === "city_specific" ||
    verdict === "suggestive"
  ) {
    return "outline";
  }
  return "secondary";
}

export function noiseFloorForCity(
  city: string | null | undefined,
): { min: number; max: number } | null {
  if (!city) {
    return null;
  }
  const match = STUDY_CITIES.find(
    (c) => c.city === city.toLowerCase() || c.label.toLowerCase() === city.toLowerCase(),
  );
  if (!match) {
    return null;
  }
  return { min: match.noiseFloorMin, max: match.noiseFloorMax };
}

/** Absolute effect size at or below the city's floor is unresolvable. */
export function isBelowNoiseFloor(
  value: number | null | undefined,
  city: string | null | undefined,
): boolean {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return false;
  }
  const floor = noiseFloorForCity(city);
  if (!floor) {
    return false;
  }
  return Math.abs(value) <= floor.max;
}
