import type {
  AbsorptionLadderResponse,
  ModelResultDto,
  VerdictDto,
  VerdictKind,
} from "@kerbside/shared";
import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { TransferCurveChart } from "@/components/TransferCurveChart";
import { ContrastCiChart } from "@/components/ContrastCiChart";
import { FactorialBarChart } from "@/components/FactorialBarChart";
import { LadderChart } from "@/components/LadderChart";
import { VerdictCard } from "@/components/VerdictCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  groupVerdictsByTopic,
  type OutcomeBand,
} from "@/lib/claimTopics";
import { VERDICT_ORDER, groupVerdicts } from "@/lib/verdicts";
import { cn } from "@/lib/utils";

const SECTION_LABELS: Record<VerdictKind, string> = {
  proven: "Proven",
  suggestive: "Suggestive",
  city_specific: "City-specific",
  withdrawn: "Withdrawn",
  disproven: "Disproven",
  harmful: "Harmful",
  untested: "Untested",
};

type ViewMode = "strand" | "verdict";
type VerdictFilter = VerdictKind | "all" | "failed_pair";

export type ScoreboardViewProps = {
  verdicts: VerdictDto[];
  ladder: AbsorptionLadderResponse | null;
  radiusResults?: ModelResultDto[] | null;
  transferResults?: ModelResultDto[] | null;
  isLadderLoading?: boolean;
  isRadiusLoading?: boolean;
  isTransferLoading?: boolean;
  standingWarning?: string;
  warnings?: string[];
  onRetrySupporting?: () => void;
};

function BandBlock({
  band,
  collapseWhenLarge,
  showStrandTag,
}: {
  band: OutcomeBand;
  collapseWhenLarge: boolean;
  showStrandTag: boolean;
}) {
  const cards = (
    <div className="grid gap-4">
      {band.items.map((verdict) => (
        <VerdictCard
          key={verdict.id}
          verdict={verdict}
          showStrandTag={showStrandTag}
        />
      ))}
    </div>
  );

  const quiet = band.id === "did_not_hold";
  const collapse = quiet && collapseWhenLarge && band.items.length > 2;

  return (
    <div
      data-testid={`outcome-band-${band.id}`}
      className={cn(
        "space-y-3 rounded-2xl border p-4",
        quiet
          ? "border-muted-foreground/25 bg-muted/20"
          : "border-border/60 bg-background/40",
      )}
    >
      <h3 className="text-base font-semibold tracking-tight">
        {band.label}
        <span className="text-muted-foreground ml-2 text-sm font-normal">
          ({band.items.length})
        </span>
      </h3>
      {collapse ? (
        <details>
          <summary className="text-muted-foreground cursor-pointer text-sm font-medium">
            Show {band.items.length} claims that did not hold
          </summary>
          <div className="mt-3">{cards}</div>
        </details>
      ) : (
        cards
      )}
    </div>
  );
}

export function ScoreboardView({
  verdicts,
  ladder,
  radiusResults = null,
  transferResults = null,
  isLadderLoading = false,
  isRadiusLoading = false,
  isTransferLoading = false,
  standingWarning,
  warnings = [],
  onRetrySupporting,
}: ScoreboardViewProps) {
  const [query, setQuery] = useState("");
  const [verdictFilter, setVerdictFilter] = useState<VerdictFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("strand");

  const queryFiltered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return verdicts;
    return verdicts.filter((verdict) =>
      `${verdict.claim} ${verdict.evidence} ${verdict.verdict}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [query, verdicts]);

  const filteredVerdicts = useMemo(() => {
    if (verdictFilter === "all") return queryFiltered;
    if (verdictFilter === "failed_pair") {
      return queryFiltered.filter(
        (verdict) =>
          verdict.verdict === "disproven" || verdict.verdict === "harmful",
      );
    }
    return queryFiltered.filter((verdict) => verdict.verdict === verdictFilter);
  }, [queryFiltered, verdictFilter]);

  const topicGroups = useMemo(
    () => groupVerdictsByTopic(filteredVerdicts, VERDICT_ORDER),
    [filteredVerdicts],
  );
  const groupedByVerdict = useMemo(
    () => groupVerdicts(filteredVerdicts),
    [filteredVerdicts],
  );
  const groupedForChips = groupVerdicts(queryFiltered);

  const hasRadiusCharts =
    radiusResults !== null &&
    radiusResults.some(
      (r) =>
        r.notes.startsWith("k80b_factorial") ||
        r.notes.startsWith("k84_posterior"),
    );
  const hasLadder = Boolean(ladder && ladder.cities.length > 0);
  const hasTransferCurve =
    transferResults !== null &&
    transferResults.some((r) => r.notes.startsWith("k173_curve"));

  const disprovenHarmfulCount =
    groupedForChips.disproven.length + groupedForChips.harmful.length;

  let radiusCharts: ReactNode = null;
  if (isRadiusLoading) {
    radiusCharts = <Skeleton className="h-72 w-full" />;
  } else if (hasRadiusCharts && radiusResults) {
    radiusCharts = (
      <div
        className="space-y-6"
        data-testid="scoreboard-radius-charts"
      >
        <div className="space-y-3">
          <h4 className="text-sm font-semibold tracking-tight">
            Radius × weighting charts
          </h4>
          <FactorialBarChart results={radiusResults} />
        </div>
        <div className="space-y-3">
          <h4 className="text-sm font-semibold tracking-tight">
            Which contrasts clear zero?
          </h4>
          <ContrastCiChart results={radiusResults} />
        </div>
      </div>
    );
  }

  let ladderChart: ReactNode = null;
  if (isLadderLoading) {
    ladderChart = <Skeleton className="h-64 w-full" />;
  } else if (hasLadder && ladder) {
    ladderChart = (
      <div data-testid="scoreboard-ladder" className="space-y-3">
        <h4 className="text-sm font-semibold tracking-tight">
          Absorption ladder
        </h4>
        <LadderChart ladder={ladder} />
      </div>
    );
  }

  let transferCurve: ReactNode = null;
  if (isTransferLoading) {
    transferCurve = <Skeleton className="h-72 w-full" />;
  } else if (hasTransferCurve && transferResults) {
    transferCurve = (
      <div data-testid="scoreboard-transfer-curve" className="space-y-3">
        <h3 className="text-sm font-semibold tracking-tight">
          Twelve-city transfer curve
        </h3>
        <TransferCurveChart results={transferResults} />
      </div>
    );
  }

  return (
    <div className="space-y-10" data-testid="scoreboard">
      <header className="space-y-5">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            Findings
          </h1>
          <p className="text-muted-foreground max-w-3xl text-base leading-relaxed">
            Twelve cities. Ranking transfers at two; scale needs a local
            intercept; the transferable radius is still 800 / 1,600 / 3,200 m.
          </p>
          <p className="text-muted-foreground text-sm">
            For a meeting, open{" "}
            <Link
              to="/cities"
              className="text-foreground underline underline-offset-2"
            >
              Cities
            </Link>
            {" "}first. New here?{" "}
            <Link
              to="/guide"
              className="text-foreground underline underline-offset-2"
            >
              Read the story
            </Link>
            .
          </p>
        </div>

        <section
          aria-labelledby="at-a-glance-heading"
          className="space-y-4"
          data-testid="at-a-glance"
        >
          <h2
            id="at-a-glance-heading"
            className="text-lg font-semibold tracking-tight"
          >
            Headlines
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <a
              href="#topic-transfer_methods"
              className="glass-surface motion-interactive block rounded-2xl border p-4 no-underline"
            >
              <p className="text-sm font-medium">Ranking transfers</p>
              <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                Mean held-out r² +0.31 at two training cities; it does not
                need more cities.
              </p>
            </a>
            <a
              href="#topic-transfer_methods"
              className="glass-surface motion-interactive block rounded-2xl border p-4 no-underline"
            >
              <p className="text-sm font-medium">Local intercept</p>
              <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                Scale needs about ten local counts. Not the busiest ten.
              </p>
            </a>
            <a
              href="#topic-headline"
              className="glass-surface motion-interactive block rounded-2xl border p-4 no-underline"
            >
              <p className="text-sm font-medium">Radius: narrow rejected</p>
              <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                800 / 1,600 / 3,200 m beats the narrow envelope in 11 of 12
                cities; it is not separable from the wider one.
              </p>
            </a>
          </div>

          {transferCurve}

          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filter by outcome"
          >
            <Button
              type="button"
              size="sm"
              variant={verdictFilter === "all" ? "default" : "outline"}
              onClick={() => setVerdictFilter("all")}
            >
              All ({verdicts.length})
            </Button>
            {(
              [
                ["proven", groupedForChips.proven.length],
                ["city_specific", groupedForChips.city_specific.length],
                ["suggestive", groupedForChips.suggestive.length],
                ["withdrawn", groupedForChips.withdrawn.length],
              ] as const
            ).map(([kind, count]) =>
              count === 0 && verdictFilter !== kind ? null : (
                <Button
                  key={kind}
                  type="button"
                  size="sm"
                  variant={verdictFilter === kind ? "default" : "outline"}
                  onClick={() => setVerdictFilter(kind)}
                >
                  {SECTION_LABELS[kind]} ({count})
                </Button>
              ),
            )}
            {disprovenHarmfulCount > 0 || verdictFilter === "failed_pair" ? (
              <Button
                type="button"
                size="sm"
                variant={verdictFilter === "failed_pair" ? "default" : "outline"}
                onClick={() => setVerdictFilter("failed_pair")}
              >
                Disproven / harmful ({disprovenHarmfulCount})
              </Button>
            ) : null}
            {groupedForChips.untested.length > 0 ||
            verdictFilter === "untested" ? (
              <Button
                type="button"
                size="sm"
                variant={verdictFilter === "untested" ? "default" : "outline"}
                onClick={() => setVerdictFilter("untested")}
              >
                Untested ({groupedForChips.untested.length})
              </Button>
            ) : null}
          </div>
        </section>
      </header>

      {standingWarning ? (
        <details data-testid="standing-warning" className="rounded-2xl border p-4">
          <summary className="cursor-pointer text-sm font-medium">
            About older radius settings
          </summary>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
            {standingWarning}
          </p>
        </details>
      ) : null}

      {warnings.length > 0 ? (
        <Alert data-testid="scoreboard-partial-error">
          <AlertTitle>Some supporting evidence is unavailable</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{warnings.join(" ")}</p>
            {onRetrySupporting ? (
              <Button variant="outline" size="sm" onClick={onRetrySupporting}>
                Retry supporting evidence
              </Button>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="glass-surface sticky top-[4.5rem] z-30 space-y-3 rounded-2xl border p-3 backdrop-blur-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Findings view"
            data-testid="view-mode-toggle"
          >
            <Button
              type="button"
              size="sm"
              variant={viewMode === "strand" ? "default" : "outline"}
              onClick={() => setViewMode("strand")}
            >
              By research strand
            </Button>
            <Button
              type="button"
              size="sm"
              variant={viewMode === "verdict" ? "default" : "outline"}
              onClick={() => setViewMode("verdict")}
            >
              By verdict
            </Button>
          </div>
          <label className="text-sm font-medium">
            <span className="sr-only">Search claims</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search claims"
              className="glass-surface motion-interactive border-input placeholder:text-muted-foreground h-9 w-full rounded-xl border px-3 text-sm sm:w-56"
              type="search"
            />
          </label>
        </div>
        {viewMode === "strand" ? (
          <nav
            className="flex flex-wrap gap-x-4 gap-y-1 text-sm"
            aria-label="Research strands"
          >
            {topicGroups.map(({ topic }) => (
              <a
                key={topic.id}
                className="underline underline-offset-2"
                href={`#topic-${topic.id}`}
              >
                {topic.label}
              </a>
            ))}
          </nav>
        ) : null}
      </div>

      <section className="space-y-8" aria-labelledby="verdicts-heading">
        <div>
          <h2
            id="verdicts-heading"
            className="text-lg font-semibold tracking-tight"
          >
            {viewMode === "strand"
              ? "Claims by research strand"
              : "Claims by verdict"}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {viewMode === "strand"
              ? "Each strand answers one question. Inside it, Held up / City-specific / Did not hold stay separate."
              : "Flat list by verdict. Strand tags still show which question each claim belongs to."}
          </p>
        </div>

        {query && filteredVerdicts.length === 0 ? (
          <p
            className="text-muted-foreground text-sm"
            data-testid="verdict-search-empty"
          >
            No claims match “{query}”.
          </p>
        ) : null}

        {viewMode === "strand"
          ? topicGroups.map(({ topic, bands }) => (
              <section
                key={topic.id}
                id={`topic-${topic.id}`}
                data-testid={`topic-group-${topic.id}`}
                className="scroll-mt-28 space-y-4"
              >
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold tracking-tight">
                    {topic.label}
                  </h2>
                  <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
                    {topic.blurb}
                  </p>
                </div>

                {topic.id === "headline" && radiusCharts ? (
                  <div className="space-y-3">{radiusCharts}</div>
                ) : null}
                {topic.id === "controls" && ladderChart ? (
                  <div className="space-y-3">{ladderChart}</div>
                ) : null}

                {bands.map((band) => (
                  <BandBlock
                    key={band.id}
                    band={band}
                    collapseWhenLarge
                    showStrandTag={false}
                  />
                ))}
              </section>
            ))
          : VERDICT_ORDER.map((kind) => {
              const items = groupedByVerdict[kind];
              if (items.length === 0) return null;
              return (
                <section
                  key={kind}
                  id={`verdict-${kind}`}
                  data-testid={`verdict-group-${kind}`}
                  className="scroll-mt-28 space-y-4"
                >
                  <h2 className="text-lg font-semibold tracking-tight">
                    {SECTION_LABELS[kind]}
                    <span className="text-muted-foreground ml-2 text-sm font-normal">
                      ({items.length})
                    </span>
                  </h2>
                  <div className="grid gap-4">
                    {items.map((verdict) => (
                      <VerdictCard
                        key={verdict.id}
                        verdict={verdict}
                        showStrandTag
                      />
                    ))}
                  </div>
                </section>
              );
            })}
      </section>
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

export function ScoreboardError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <Alert variant="destructive" data-testid="scoreboard-error">
      <AlertTitle>Could not load findings</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{message}</p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      </AlertDescription>
    </Alert>
  );
}
