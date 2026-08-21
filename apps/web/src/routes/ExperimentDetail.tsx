import type {
  AbsorptionLadderResponse,
  ExperimentDetailResponse,
  ExperimentResultsResponse,
  ModelResultDto,
} from "@kerbside/shared";
import { useEffect, type ReactNode } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router";
import { ContrastCiChart } from "@/components/ContrastCiChart";
import { DecayCurveChart } from "@/components/DecayCurveChart";
import { FactorialBarChart } from "@/components/FactorialBarChart";
import { LadderChart } from "@/components/LadderChart";
import { ModelLadderTable } from "@/components/ModelLadderTable";
import { NarrowVsWideChart } from "@/components/NarrowVsWideChart";
import { PooledVsLocoChart } from "@/components/PooledVsLocoChart";
import { RandomVsSpatialChart } from "@/components/RandomVsSpatialChart";
import { TurnCostSweepChart } from "@/components/TurnCostSweepChart";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiUrl } from "@/lib/apiBase";
import { notesFamily } from "@/lib/chartData";
import { useApi } from "@/lib/useApi";
import { NotFound } from "./NotFound";

const CLASSIC_CV_SLUGS = new Set([
  "exp1",
  "exp2",
  "exp3",
  "exp4",
  "exp5",
  "exp6",
  "exp7",
]);

const NOTES_SECTION_TITLE: Record<string, string> = {
  k80b_factorial: "2×2 factorial (radius × weighting)",
  k80_radius_pooled: "Radius ladder (matched k)",
  k80_decay_curve: "Empirical decay-band coefficients",
  k84_posterior: "Bootstrap contrasts (95% CI)",
  k88_slope_narrow: "Slope effect at narrow radii",
  k88_slope_wide: "Slope effect at wide radii",
  k81: "Turn-cost sweep",
  k82_gva_walk: "GVA vs accessibility arms",
  k89_walk_pagerank_pt: "Pedestrian PageRank / PT blocks",
  k83_orig: "Slope before DEM correction",
  k83_delta_ext20: "Change after ext20 DEM correction",
  k85_mode_share: "Census mode-share arms",
  k90_rail_usage: "ORR station-usage arms",
  k73_pooled: "Pooled configuration ladder",
  k73_loco: "Leave-one-city-out by held-out city",
  k60_matched: "Matched slope isolation",
  k91_floor_mean: "Noise floors (mean-per-fold)",
  k91_floor_pooled: "Noise floors (pooled OOF)",
  k91_min_detectable: "Minimum detectable effect",
  k94_changed: "Verdicts recovered under pooled OOF",
  k96_slope_ladder: "Slope ladder (vs preset)",
  k97_slope_x_radius: "Slope exponent by radius envelope",
  k97_factorial: "Slope × radius factorial",
  k97_decomposition: "Additivity decomposition",
  k93_multimodal: "Multimodal station-usage arms",
  k130_osm_ground_truth: "OpenStreetMap provision ground truth",
  k133_i4_direct_osm: "Cycle-provision impedance ladder",
  k139b_geometry: "Street View capture-geometry sweep",
  k140_angular: "Angular-coefficient sweep",
  k143_scale_transfer: "Scale-normalised leave-one-city-out transfer",
  k144_fdr: "Multiplicity correction (Benjamini–Hochberg)",
};

function groupResults(results: ModelResultDto[]): Array<{
  key: string;
  title: string;
  rows: ModelResultDto[];
}> {
  const families = new Map<string, ModelResultDto[]>();
  for (const row of results) {
    const key = notesFamily(row.notes) || "results";
    const list = families.get(key) ?? [];
    list.push(row);
    families.set(key, list);
  }
  return [...families.entries()].map(([key, rows]) => ({
    key,
    title:
      NOTES_SECTION_TITLE[key] ??
      (key === "results" ? "Results" : key),
    rows,
  }));
}

function chartForFamily(
  family: string,
  rows: ModelResultDto[],
  allResults: ModelResultDto[],
): ReactNode {
  switch (family) {
    case "k80b_factorial":
      return <FactorialBarChart results={rows} />;
    case "k80_decay_curve":
      return <DecayCurveChart results={rows} />;
    case "k84_posterior":
      return <ContrastCiChart results={rows} />;
    case "k81":
      return <TurnCostSweepChart results={rows} />;
    case "k85_mode_share":
      return (
        <PooledVsLocoChart
          results={rows}
          caption="Census 2021 travel-to-work (K85): within-city pooled skill for weighted arms; every leave-one-city-out score is negative."
        />
      );
    case "k73_pooled":
      return (
        <PooledVsLocoChart
          results={rows}
          caption="Pooled configuration ladder (K73): spatial column is pooled R²; LOCO is leave-one-city-out mean."
          testId="transfer-pooled-vs-loco-chart"
        />
      );
    case "k90_rail_usage":
      return (
        <PooledVsLocoChart
          results={rows}
          caption="ORR station usage (K90): every arm is negative — network structure does not predict rail volume here."
          testId="rail-pooled-vs-loco-chart"
        />
      );
    case "k80_radius_pooled":
      return (
        <PooledVsLocoChart
          results={rows}
          caption="Matched-k radius ladder (K80/K95): peaks at 800,1600,3200 — both narrower and the wider 1600,3200,6400 arm are worse."
          testId="radius-ladder-chart"
        />
      );
    case "k88_slope_narrow":
      // Render once with both narrow+wide from the full experiment payload.
      return <NarrowVsWideChart results={allResults} />;
    case "k88_slope_wide":
      return null;
    default:
      return null;
  }
}

export function ExperimentDetailPage() {
  const { slug } = useParams();
  const { hash } = useLocation();
  const detailUrl = slug ? apiUrl(`/api/experiments/${slug}`) : null;
  const resultsUrl = slug ? apiUrl(`/api/experiments/${slug}/results`) : null;
  const ladderUrl =
    slug === "absorption" ? apiUrl("/api/ladder") : null;

  const detail = useApi<ExperimentDetailResponse>(detailUrl);
  const results = useApi<ExperimentResultsResponse>(resultsUrl);
  const ladder = useApi<AbsorptionLadderResponse>(ladderUrl);

  const resultsReady =
    !detail.isLoading &&
    !results.isLoading &&
    !(ladderUrl && ladder.isLoading) &&
    Boolean(detail.data) &&
    Boolean(results.data);

  useEffect(() => {
    if (!resultsReady || !hash) {
      return;
    }
    const id = decodeURIComponent(hash.replace(/^#/, ""));
    if (!id) {
      return;
    }
    // Wait a frame so section ids from grouped results are in the DOM.
    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(id);
      target?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      target?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [resultsReady, hash, slug]);

  if (!slug) {
    return (
      <NotFound
        title="Experiment not found"
        message="No experiment slug was provided."
      />
    );
  }

  if (slug === "controls") {
    return <Navigate to="/controls" replace />;
  }

  if (detail.isLoading || results.isLoading || (ladderUrl && ladder.isLoading)) {
    return (
      <div className="space-y-6" data-testid="experiment-loading">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="aspect-video w-full" />
      </div>
    );
  }

  if (detail.status === 404 || results.status === 404) {
    return (
      <NotFound
        title="Experiment not found"
        message={`No experiment with slug “${slug}”.`}
      />
    );
  }

  if (detail.error || !detail.data) {
    return (
      <Alert variant="destructive" data-testid="experiment-error">
        <AlertTitle>Could not load experiment</AlertTitle>
      <AlertDescription className="space-y-3">
          <p>{detail.error ?? "Experiment response was empty"}</p>
          <Button variant="outline" size="sm" onClick={detail.retry}>
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (results.error || !results.data) {
    return (
      <Alert variant="destructive" data-testid="experiment-error">
        <AlertTitle>Could not load model results</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{results.error ?? "Results response was empty"}</p>
          <Button variant="outline" size="sm" onClick={results.retry}>
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const { experiment } = detail.data;
  const { results: modelResults } = results.data;
  const isAbsorption = slug === "absorption";
  const showClassicCvChart =
    CLASSIC_CV_SLUGS.has(slug) &&
    modelResults.some((r) => r.randomR2 !== null && r.spatialR2 !== null);

  const groups = groupResults(modelResults);

  return (
    <div className="space-y-10" data-testid="experiment-detail">
      <header className="space-y-3">
        <nav aria-label="Breadcrumb" className="text-muted-foreground text-sm">
          <Link to="/" className="hover:text-foreground underline underline-offset-2">
            Findings
          </Link>
          <span aria-hidden="true"> / </span>
          <span>Experiment evidence</span>
        </nav>
        <h1 className="text-3xl font-semibold tracking-tight">
          {experiment.title}
        </h1>
        <p className="text-foreground max-w-3xl text-base leading-relaxed">
          {experiment.question}
        </p>
        <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
          {experiment.methodNote}
        </p>
      </header>

      {groups.length > 1 ? (
        <nav
          className="glass-surface motion-interactive rounded-2xl border p-4"
          aria-label="Experiment sections"
        >
          <p className="text-sm font-medium">On this page</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {groups.map((group) => (
              <a
                key={group.key}
                href={`#${group.key}`}
                className="underline underline-offset-2"
              >
                {group.title}
              </a>
            ))}
            {isAbsorption ? (
              <a href="#absorption-ladder" className="underline underline-offset-2">
                Absorption ladder
              </a>
            ) : null}
          </div>
        </nav>
      ) : null}

      {ladder.error ? (
        <Alert data-testid="experiment-partial-error">
          <AlertTitle>The absorption ladder is unavailable</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>The rest of this experiment remains available.</p>
            <Button variant="outline" size="sm" onClick={ladder.retry}>
              Retry ladder
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {modelResults.length === 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Results</h2>
          <ModelLadderTable
            results={modelResults}
            emptyMessage="No tabular rows are available for this experiment."
          />
        </section>
      ) : (
        groups.map((group) => {
          const chart = chartForFamily(group.key, group.rows, modelResults);
          return (
            <section
              key={group.key}
              id={group.key}
              tabIndex={-1}
              className="scroll-mt-8 space-y-3"
            >
              <h2 className="text-lg font-semibold tracking-tight">
                {group.title}
              </h2>
              {chart}
              <ModelLadderTable results={group.rows} />
            </section>
          );
        })
      )}

      {isAbsorption && ladder.data && ladder.data.cities.length > 0 ? (
        <section
          id="absorption-ladder"
          tabIndex={-1}
          className="scroll-mt-8 space-y-3"
        >
          <h2 className="text-lg font-semibold tracking-tight">
            Three-city absorption path
          </h2>
          <LadderChart ladder={ladder.data} />
        </section>
      ) : null}

      {showClassicCvChart ? (
        <section
          id="random-vs-spatial"
          tabIndex={-1}
          className="scroll-mt-8 space-y-3"
        >
          <h2 className="text-lg font-semibold tracking-tight">
            Random vs spatial R²
          </h2>
          <RandomVsSpatialChart results={modelResults} />
          <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
            Random folds put nearby count points in both train and test, so that
            R² looks too good. Spatial blocking is the number to quote.
          </p>
        </section>
      ) : null}
    </div>
  );
}
