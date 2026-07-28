import type {
  ExperimentDetailResponse,
  ExperimentResultsResponse,
} from "@kerbside/shared";
import { useParams } from "react-router";
import { LadderChart } from "@/components/LadderChart";
import { ModelLadderTable } from "@/components/ModelLadderTable";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { apiUrl } from "@/lib/apiBase";
import { useApi } from "@/lib/useApi";
import { NotFound } from "./NotFound";

export function ExperimentDetailPage() {
  const { slug } = useParams();
  const detailUrl = slug ? apiUrl(`/api/experiments/${slug}`) : null;
  const resultsUrl = slug ? apiUrl(`/api/experiments/${slug}/results`) : null;

  const detail = useApi<ExperimentDetailResponse>(detailUrl);
  const results = useApi<ExperimentResultsResponse>(resultsUrl);

  if (!slug) {
    return (
      <NotFound
        title="Experiment not found"
        message="No experiment slug was provided."
      />
    );
  }

  if (detail.isLoading || results.isLoading) {
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
        <AlertDescription>
          {detail.error ?? "Experiment response was empty"}
        </AlertDescription>
      </Alert>
    );
  }

  if (results.error || !results.data) {
    return (
      <Alert variant="destructive" data-testid="experiment-error">
        <AlertTitle>Could not load model results</AlertTitle>
        <AlertDescription>
          {results.error ?? "Results response was empty"}
        </AlertDescription>
      </Alert>
    );
  }

  const { experiment } = detail.data;
  const { results: modelResults } = results.data;

  return (
    <div className="space-y-10" data-testid="experiment-detail">
      <header className="space-y-3">
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

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Model ladder</h2>
        <ModelLadderTable results={modelResults} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">
          Random vs spatial R²
        </h2>
        <LadderChart results={modelResults} />
        <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
          Random K-fold leaks across spatially autocorrelated count points —
          nearby sites end up in both train and test — so the optimistic random
          R² overstates generalisation. Spatial blocking is the honest number.
        </p>
      </section>
    </div>
  );
}
