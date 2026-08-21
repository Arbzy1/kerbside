import type { ModelResultDto } from "@kerbside/shared";
import { Link } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatSignedR2, isBelowNoiseFloor } from "@/lib/verdicts";
import { cn } from "@/lib/utils";

export type ModelLadderLabels = {
  random?: string;
  spatial?: string;
  loco?: string;
};

type ModelLadderTableProps = {
  results: ModelResultDto[];
  labels?: ModelLadderLabels;
  emptyMessage?: string;
};

function defaultLabels(results: ModelResultDto[]): Required<ModelLadderLabels> {
  const notes = results.map((r) => r.notes);
  const isTurn = notes.some((n) => n.includes("k81"));
  const isPosterior = notes.some((n) => n.includes("k84_posterior"));
  const usesRho = notes.some(
    (n) =>
      n.includes("k73") ||
      n.includes("k80") ||
      n.includes("k85") ||
      n.includes("k89") ||
      n.includes("k90"),
  );
  const isDelta = notes.some(
    (n) =>
      n.includes("stage2") ||
      n.includes("k60") ||
      n.includes("k88") ||
      n.includes("k83"),
  );
  const isDecay = notes.some((n) => n.includes("decay"));

  if (isPosterior) {
    return {
      random: "CI lo",
      spatial: "Point (LOCO Δ)",
      loco: "CI hi",
    };
  }

  const isFloor = notes.some((n) => n.includes("k91_floor") || n.includes("k91_min"));
  const isRescore = notes.some((n) => n.includes("k94"));
  const isSlopeLadder = notes.some((n) => n.includes("k96"));
  const isMultimodal = notes.some((n) => n.includes("k93"));

  if (isFloor) {
    return { random: "—", spatial: "Floor / δ", loco: "—" };
  }
  if (isRescore) {
    return {
      random: "Δ (mean-per-fold)",
      spatial: "Δ (pooled OOF)",
      loco: "× new floor",
    };
  }
  if (isSlopeLadder) {
    return { random: "Δ vs preset", spatial: "R²", loco: "—" };
  }
  if (isMultimodal) {
    return { random: "Spearman ρ", spatial: "Pooled R²", loco: "vs road-only" };
  }

  return {
    random: isTurn ? "Δ vs preset" : usesRho ? "Spearman ρ" : "Random R²",
    spatial: isDecay
      ? "Std. coefficient"
      : isDelta
        ? "Δ R²"
        : isTurn
          ? "R²"
          : usesRho
            ? "Pooled R²"
            : "Spatial R²",
    loco: "LOCO R²",
  };
}

export function ModelLadderTable({
  results,
  labels,
  emptyMessage = "No model rows are seeded for this experiment yet.",
}: ModelLadderTableProps) {
  if (results.length === 0) {
    return (
      <p
        className="text-muted-foreground text-sm leading-relaxed"
        data-testid="model-ladder-empty"
      >
        {emptyMessage}
      </p>
    );
  }

  const resolved = { ...defaultLabels(results), ...labels };
  const showCity = results.some((r) => r.city);
  const showK = results.some((r) => r.k !== null);
  const showRandom = results.some((r) => r.randomR2 !== null);
  const showSpatial = results.some((r) => r.spatialR2 !== null);
  const showLoco = results.some((r) => r.locoR2 !== null);
  const hasNoiseFloorValue = results.some(
    (row) =>
      isBelowNoiseFloor(row.randomR2, row.city) ||
      isBelowNoiseFloor(row.spatialR2, row.city) ||
      isBelowNoiseFloor(row.locoR2, row.city),
  );

  return (
    <div className="space-y-2">
      {hasNoiseFloorValue ? (
        <p className="text-muted-foreground text-sm">
          “noise” marks an effect at or below that city’s noise floor: it is
          unresolvable, not evidence of a win or loss.{" "}
          <Link to="/guide#reading-a-result" className="underline underline-offset-2">
            Read the definition
          </Link>
          .
        </p>
      ) : null}
      <Table data-testid="model-ladder-table">
        <TableHeader>
        <TableRow>
          <TableHead>Model</TableHead>
          {showCity ? <TableHead>City</TableHead> : null}
          {showK ? <TableHead className="text-right">k</TableHead> : null}
          {showRandom ? (
            <TableHead className="text-right">{resolved.random}</TableHead>
          ) : null}
          {showSpatial ? (
            <TableHead className="text-right">{resolved.spatial}</TableHead>
          ) : null}
          {showLoco ? (
            <TableHead className="text-right">{resolved.loco}</TableHead>
          ) : null}
          <TableHead className="text-right">n</TableHead>
        </TableRow>
        </TableHeader>
        <TableBody>
        {results.map((row) => {
          const spatialNoise = isBelowNoiseFloor(row.spatialR2, row.city);
          const randomNoise = isBelowNoiseFloor(row.randomR2, row.city);
          const locoNoise = isBelowNoiseFloor(row.locoR2, row.city);
          return (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.modelName}</TableCell>
              {showCity ? (
                <TableCell className="capitalize text-muted-foreground">
                  {row.city ?? "—"}
                </TableCell>
              ) : null}
              {showK ? (
                <TableCell className="text-right tabular-nums">
                  {row.k ?? "—"}
                </TableCell>
              ) : null}
              {showRandom ? (
                <TableCell
                  className={cn(
                    "text-right tabular-nums",
                    randomNoise && "text-muted-foreground opacity-60",
                  )}
                  title={
                    randomNoise
                      ? "At or below this city's noise floor — unresolvable"
                      : undefined
                  }
                >
                  {formatSignedR2(row.randomR2)}
                  {randomNoise ? " · noise" : ""}
                </TableCell>
              ) : null}
              {showSpatial ? (
                <TableCell
                  className={cn(
                    "text-right tabular-nums",
                    spatialNoise && "text-muted-foreground opacity-60",
                  )}
                  title={
                    spatialNoise
                      ? "At or below this city's noise floor — unresolvable"
                      : undefined
                  }
                  data-noise={spatialNoise ? "below-floor" : undefined}
                >
                  {formatSignedR2(row.spatialR2)}
                  {spatialNoise ? " · noise" : ""}
                </TableCell>
              ) : null}
              {showLoco ? (
                <TableCell
                  className={cn(
                    "text-right tabular-nums",
                    locoNoise && "text-muted-foreground opacity-60",
                  )}
                  title={
                    locoNoise
                      ? "At or below this city's noise floor — unresolvable"
                      : undefined
                  }
                >
                  {formatSignedR2(row.locoR2)}
                  {locoNoise ? " · noise" : ""}
                </TableCell>
              ) : null}
              <TableCell className="text-right tabular-nums">
                {row.n ?? "—"}
              </TableCell>
            </TableRow>
          );
        })}
        </TableBody>
      </Table>
    </div>
  );
}
