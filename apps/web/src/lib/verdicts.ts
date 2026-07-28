import type { VerdictDto, VerdictKind } from "@kerbside/shared";

export const VERDICT_ORDER = [
  "proven",
  "disproven",
  "harmful",
  "untested",
] as const satisfies readonly VerdictKind[];

export type GroupedVerdicts = Record<VerdictKind, VerdictDto[]>;

export function groupVerdicts(verdicts: VerdictDto[]): GroupedVerdicts {
  const grouped: GroupedVerdicts = {
    proven: [],
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
): "default" | "destructive" | "secondary" {
  if (verdict === "proven") {
    return "default";
  }
  if (verdict === "disproven" || verdict === "harmful") {
    return "destructive";
  }
  return "secondary";
}
