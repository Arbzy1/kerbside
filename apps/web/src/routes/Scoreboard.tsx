import type { VerdictDto, VerdictKind } from "@kerbside/shared";
import { VerdictCard } from "@/components/VerdictCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { VERDICT_ORDER, groupVerdicts } from "@/lib/verdicts";

const SECTION_LABELS: Record<VerdictKind, string> = {
  proven: "Proven",
  disproven: "Disproven",
  harmful: "Harmful",
  untested: "Untested",
};

export type ScoreboardViewProps = {
  verdicts: VerdictDto[];
};

export function ScoreboardView({ verdicts }: ScoreboardViewProps) {
  const grouped = groupVerdicts(verdicts);

  return (
    <div className="space-y-10" data-testid="scoreboard">
      <p className="text-muted-foreground max-w-3xl text-base leading-relaxed">
        This scoreboard answers which claims about street-network and attractor
        features actually improve cycle-flow prediction — and which ones do not —
        under spatially honest validation.
      </p>

      {VERDICT_ORDER.map((kind) => {
        const items = grouped[kind];
        if (items.length === 0) {
          return null;
        }
        return (
          <section
            key={kind}
            data-testid={`verdict-group-${kind}`}
            className="space-y-4"
          >
            <h2 className="text-lg font-semibold tracking-tight">
              {SECTION_LABELS[kind]}
            </h2>
            <div className="grid gap-4">
              {items.map((verdict) => (
                <VerdictCard key={verdict.id} verdict={verdict} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function ScoreboardLoading() {
  return (
    <div className="space-y-6" data-testid="scoreboard-loading">
      <Skeleton className="h-16 w-full max-w-3xl" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-28 w-full" />
    </div>
  );
}

export function ScoreboardError({ message }: { message: string }) {
  return (
    <Alert variant="destructive" data-testid="scoreboard-error">
      <AlertTitle>Could not load the scoreboard</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
