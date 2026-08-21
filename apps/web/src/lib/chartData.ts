import type { ModelResultDto } from "@kerbside/shared";

/** First segment of notes before `|` (e.g. k81|cost=… → k81). */
export function notesFamily(notes: string): string {
  return notes.split("|")[0] ?? notes;
}

export function filterByNotesFamily(
  results: ModelResultDto[],
  family: string,
): ModelResultDto[] {
  return results.filter((r) => notesFamily(r.notes) === family);
}

export function filterByNotesPrefix(
  results: ModelResultDto[],
  prefix: string,
): ModelResultDto[] {
  return results.filter((r) => notesFamily(r.notes).startsWith(prefix));
}

/** Parse `cost=<number>` from notes like `k81|cost=430.08|resolvable=True`. */
export function parseNotesCost(notes: string): number | null {
  const match = /(?:^|\|)cost=([^|]+)/.exec(notes);
  if (!match?.[1]) {
    return null;
  }
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : null;
}

/** Parse `p=<number>` from notes like `k84_posterior|p=0.985`. */
export function parseNotesPGt0(notes: string): number | null {
  const match = /(?:^|\|)p=([^|]+)/.exec(notes);
  if (!match?.[1]) {
    return null;
  }
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : null;
}

/** Short label for factorial cells: narrow_plain (400,800,1600) → narrow_plain */
export function factorialCellLabel(modelName: string): string {
  const paren = modelName.indexOf(" (");
  return paren === -1 ? modelName : modelName.slice(0, paren);
}

/** Parse "decay band 800 m" → 800 */
export function parseDecayRadiusM(modelName: string): number | null {
  const match = /decay band (\d+)/i.exec(modelName);
  if (!match?.[1]) {
    return null;
  }
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : null;
}
