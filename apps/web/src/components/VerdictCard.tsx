import type { VerdictDto } from "@kerbside/shared";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { topicLabelForVerdict } from "@/lib/claimTopics";
import { badgeVariantForVerdict } from "@/lib/verdicts";
import { relatedVerdictLinks, verdictHref } from "@/lib/verdictLinks";
import { cn } from "@/lib/utils";

type VerdictCardProps = {
  verdict: VerdictDto;
  /** Show research-strand tag (used in By-verdict view). */
  showStrandTag?: boolean;
};

function evidenceNumber(evidence: string, key: string): number | null {
  const match = evidence.match(
    new RegExp(`(?:^|[; ])${key}=([+-]?\\d+(?:\\.\\d+)?)`),
  );
  if (!match?.[1]) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function signed(value: number, digits = 4): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}`;
}

function splitEvidence(evidence: string): {
  summary: string;
  numbers: string | null;
  caveat: string | null;
} {
  const caveatSplit = evidence.split(/\s+Caveat:\s+/);
  const beforeCaveat = caveatSplit[0] ?? evidence;
  const caveat = caveatSplit[1]?.trim() || null;
  const numbersSplit = beforeCaveat.split(/\s+Numbers\s+\(/);
  const summary = (numbersSplit[0] ?? beforeCaveat).trim();
  const numbersTail = numbersSplit[1];
  const numbers = numbersTail
    ? `Numbers (${numbersTail}`.replace(/\.\s*$/, "")
    : null;
  return { summary, numbers, caveat };
}

function formatNullPercentileLine(
  percentile: number,
  draws: number,
  pExact: number | null,
  pFloor: number | null,
): string {
  const floor = pFloor ?? 1 / (draws + 1);
  const p = pExact ?? floor;
  return (
    `${Math.round(percentile)}th percentile of ${Math.round(draws)} draws — ` +
    `p = ${p.toFixed(3)}, floor ${floor.toFixed(3)} ` +
    `(smallest value ${Math.round(draws)} draws can resolve)`
  );
}

function CycleProvisionPanel({ evidence }: { evidence: string }) {
  const floorMultiple = evidenceNumber(evidence, "floor_multiple");
  const manchesterDelta = evidenceNumber(evidence, "manchester_delta");
  const bristolDelta = evidenceNumber(evidence, "bristol_delta");
  const cardiffDelta = evidenceNumber(evidence, "cardiff_delta");
  const placeboDelta = evidenceNumber(evidence, "placebo_delta");
  const nullPercentile = evidenceNumber(evidence, "null_percentile");
  const nullDraws = evidenceNumber(evidence, "null_draws");
  const nullPExact = evidenceNumber(evidence, "null_p_exact");
  const nullPFloor = evidenceNumber(evidence, "null_p_floor");

  if (
    floorMultiple === null ||
    manchesterDelta === null ||
    bristolDelta === null ||
    cardiffDelta === null ||
    placeboDelta === null
  ) {
    return null;
  }

  return (
    <div
      className="border-secondary/40 bg-secondary/10 rounded-xl border p-3 text-sm"
      data-testid="cycle-provision-breakdown"
    >
      <p className="text-base font-semibold">
        {Math.round(floorMultiple)}× Manchester&apos;s noise floor
      </p>
      <p className="text-muted-foreground mt-1">
        Manchester {signed(manchesterDelta)} · Bristol {signed(bristolDelta)} ·
        Cardiff {signed(cardiffDelta)}
      </p>
      <p className="text-muted-foreground mt-1">
        Hierarchy-matched placebo {signed(placeboDelta)} — about 14% of the
        Manchester effect.
      </p>
      {nullPercentile !== null && nullDraws !== null ? (
        <p
          className="text-muted-foreground mt-2"
          data-testid="null-percentile-with-p"
        >
          {formatNullPercentileLine(
            nullPercentile,
            nullDraws,
            nullPExact,
            nullPFloor,
          )}
        </p>
      ) : null}
    </div>
  );
}

function ScaleTransferPanel({ evidence }: { evidence: string }) {
  const meanRaw = evidenceNumber(evidence, "mean_loco_raw");
  const meanScaled = evidenceNumber(evidence, "mean_loco_scaled");
  const cardiffRaw = evidenceNumber(evidence, "cardiff_raw");
  const cardiffScaled = evidenceNumber(evidence, "cardiff_scaled");
  const bristolRaw = evidenceNumber(evidence, "bristol_raw");
  const bristolScaled = evidenceNumber(evidence, "bristol_scaled");
  const manchesterRaw = evidenceNumber(evidence, "manchester_raw");
  const manchesterScaled = evidenceNumber(evidence, "manchester_scaled");

  if (
    meanRaw === null ||
    meanScaled === null ||
    cardiffRaw === null ||
    cardiffScaled === null ||
    manchesterRaw === null ||
    manchesterScaled === null
  ) {
    return null;
  }

  return (
    <div
      className="border-primary/30 bg-primary/5 rounded-xl border p-3 text-sm"
      data-testid="scale-transfer-breakdown"
    >
      <p className="text-base font-semibold">
        Mean LOCO {signed(meanRaw)} → {signed(meanScaled)} after scale
        normalisation
      </p>
      <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-5">
        <li>
          Cardiff {signed(cardiffRaw)} → {signed(cardiffScaled)}{" "}
          <span className="text-foreground font-medium">(gets worse)</span>
        </li>
        {bristolRaw !== null && bristolScaled !== null ? (
          <li>
            Bristol {signed(bristolRaw)} → {signed(bristolScaled)}
          </li>
        ) : null}
        <li>
          Manchester {signed(manchesterRaw)} → {signed(manchesterScaled)}
        </li>
      </ul>
      <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
        Not a reverse of a “failed transfer” — that framing was a code defect
        (C30). Not a per-city intercept; predictors only. The k=1 interior
        optimum is withdrawn.
      </p>
    </div>
  );
}

function MultiplicityPanel({ evidence }: { evidence: string }) {
  const nSurvive = evidenceNumber(evidence, "n_survive");
  const familySize = evidenceNumber(evidence, "family_size");
  const nUndecidable = evidenceNumber(evidence, "n_undecidable");
  const topP = evidenceNumber(evidence, "top_p");
  const topFloor = evidenceNumber(evidence, "top_p_floor");
  const topBh = evidenceNumber(evidence, "top_bh_threshold");
  const topDraws = evidenceNumber(evidence, "top_draws");

  if (nSurvive === null || familySize === null) {
    return null;
  }

  const draws = topDraws !== null ? Math.round(topDraws) : null;

  return (
    <div
      className="border-primary/30 bg-primary/5 rounded-xl border p-3 text-sm"
      data-testid="multiplicity-breakdown"
    >
      <p className="text-base font-semibold">
        {Math.round(nSurvive)} of {Math.round(familySize)} survive
        {draws !== null ? `, at ${draws} draws` : ""}
      </p>
      <p className="text-muted-foreground mt-1 leading-relaxed">
        Correction declared first; at ~40 draws the family returned 0 of 6
        (undecidable at the p-floor, not refuted). More draws decided the
        Manchester provision contrasts — not a smaller family.
      </p>
      {topP !== null && topFloor !== null && topBh !== null ? (
        <p className="text-muted-foreground mt-2">
          Strongest test: p = {topP.toFixed(3)} (floor {topFloor.toFixed(3)}) vs
          BH threshold {topBh.toFixed(3)}
          {nUndecidable !== null
            ? ` · ${Math.round(nUndecidable)} still undecidable`
            : ""}
          .
        </p>
      ) : null}
      <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
        Do not read non-survivors as “disproven” — some were never decidable at
        their draw count.
      </p>
    </div>
  );
}

export function VerdictCard({
  verdict,
  showStrandTag = false,
}: VerdictCardProps) {
  const badgeVariant = badgeVariantForVerdict(verdict.verdict);
  const href = verdictHref(verdict.claim, verdict.experimentSlug);
  const related = relatedVerdictLinks(verdict.claim);
  const isWithdrawn = verdict.verdict === "withdrawn";
  const isCitySpecific = verdict.verdict === "city_specific";
  const isSuggestive = verdict.verdict === "suggestive";
  const isDisproven = verdict.verdict === "disproven";
  const isHarmful = verdict.verdict === "harmful";
  const key = verdict.claim;
  const strandLabel = showStrandTag ? topicLabelForVerdict(verdict) : null;
  const isCycleProvision =
    key ===
    "Cycle provision as routing impedance improves prediction - in Manchester";
  const isScaleTransfer =
    key ===
    "The model does transfer between cities - and the shape transfers almost exactly";
  const isMultiplicity = key.startsWith("Under multiplicity correction");
  const { summary, numbers, caveat } = splitEvidence(verdict.evidence);

  // Generic percentile-with-p for any claim that carries those fields.
  const nullPercentile = evidenceNumber(verdict.evidence, "null_percentile");
  const nullDraws = evidenceNumber(verdict.evidence, "null_draws");
  const nullPExact = evidenceNumber(verdict.evidence, "null_p_exact");
  const nullPFloor = evidenceNumber(verdict.evidence, "null_p_floor");
  const showGenericNullP =
    !isCycleProvision &&
    nullPercentile !== null &&
    nullDraws !== null;

  return (
    <Card
      data-testid="verdict-card"
      data-verdict={verdict.verdict}
      className={cn(
        href && "transition-colors hover:bg-muted/40",
        isWithdrawn && "border-dashed border-muted-foreground/40 bg-muted/20",
        isCitySpecific && "border-l-4 border-l-secondary",
        isSuggestive && "border-l-4 border-l-amber-600/70",
        (isDisproven || isHarmful) && "border-l-4 border-l-destructive",
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="min-w-0 space-y-1">
          {strandLabel ? (
            <p
              className="text-muted-foreground text-xs font-medium tracking-wide uppercase"
              data-testid="verdict-strand-tag"
            >
              {strandLabel}
            </p>
          ) : null}
          <CardTitle
            className={cn(
              "text-base leading-snug",
              isWithdrawn &&
                "text-muted-foreground line-through decoration-from-font",
            )}
          >
            {verdict.claim}
          </CardTitle>
        </div>
        <Badge
          variant={badgeVariant}
          className={cn(
            "shrink-0 font-semibold",
            verdict.verdict === "untested" &&
              "bg-muted text-muted-foreground border-transparent",
            isWithdrawn &&
              "border-stone-500/70 text-stone-800 bg-stone-100",
            isCitySpecific &&
              "border-secondary text-secondary-foreground bg-secondary/30",
            isSuggestive &&
              "border-amber-700/50 text-amber-950 bg-amber-50",
            isDisproven &&
              "border-destructive bg-destructive/10 text-destructive",
            isHarmful &&
              "border-destructive bg-destructive text-destructive-foreground",
          )}
        >
          {verdict.verdict === "city_specific"
            ? "city-specific"
            : verdict.verdict}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {isCycleProvision ? (
          <CycleProvisionPanel evidence={verdict.evidence} />
        ) : null}
        {isScaleTransfer ? (
          <ScaleTransferPanel evidence={verdict.evidence} />
        ) : null}
        {isMultiplicity ? (
          <MultiplicityPanel evidence={verdict.evidence} />
        ) : null}
        {showGenericNullP ? (
          <p
            className="text-muted-foreground text-sm"
            data-testid="null-percentile-with-p"
          >
            {formatNullPercentileLine(
              nullPercentile,
              nullDraws,
              nullPExact,
              nullPFloor,
            )}
          </p>
        ) : null}
        <p className="text-foreground text-sm leading-relaxed">{summary}</p>
        {numbers || caveat ? (
          <details className="text-muted-foreground text-sm leading-relaxed">
            <summary className="text-foreground cursor-pointer font-medium">
              Numbers & caveat
            </summary>
            <div className="mt-2 space-y-2">
              {numbers ? <p>{numbers}</p> : null}
              {caveat ? (
                <p>
                  <span className="text-foreground font-medium">Caveat:</span>{" "}
                  {caveat}
                </p>
              ) : null}
            </div>
          </details>
        ) : (
          <p className="text-muted-foreground text-sm leading-relaxed">
            {verdict.evidence}
          </p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium">
          {href ? (
            <Link
              to={href}
              viewTransition
              className="text-primary rounded-sm underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              data-testid="verdict-card-link"
              data-href={href}
            >
              View evidence <span aria-hidden="true">→</span>
              <span className="sr-only"> for {verdict.claim}</span>
            </Link>
          ) : null}
          {related.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              viewTransition
              className="text-primary rounded-sm underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              data-testid="verdict-related-link"
            >
              {link.label} <span aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
