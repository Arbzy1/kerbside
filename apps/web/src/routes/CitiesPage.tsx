import type { CitiesListResponse, TransferSummaryDto } from "@kerbside/shared";
import { CityTable } from "@/components/CityTable";
import { CityTransferChart } from "@/components/CityTransferChart";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiUrl } from "@/lib/apiBase";
import { rankCitiesByHeldOutR2 } from "@/lib/cities";
import { useApi } from "@/lib/useApi";
import { formatSignedR2 } from "@/lib/verdicts";

function TransferFraming({ summary }: { summary: TransferSummaryDto }) {
  return (
    <div className="space-y-4" data-testid="transfer-framing">
      <p className="text-muted-foreground max-w-3xl text-base leading-relaxed">
        Models trained on other authorities transfer well across the{" "}
        {summary.cohortNAuthorities}-authority cohort (n = {summary.cohortNPoints}
        ): within-city R² is {formatSignedR2(summary.withinCityR2)}, across-city
        leave-one-authority-out R² is {formatSignedR2(summary.acrossCityR2)}, a
        transfer penalty of only {formatSignedR2(summary.transferPenalty)}. Cardiff
        is the contrast case that does not — it falls below the 150-point threshold
        for that cohort (n = {summary.cardiffNPoints}), so it is shown separately
        rather than ranked among the fifteen.
      </p>

      <Card data-testid="cardiff-contrast" className="border-destructive/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Cardiff (below cohort threshold)</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed">
          <p>
            Cardiff-only model:{" "}
            <span className="text-foreground font-medium tabular-nums">
              {formatSignedR2(summary.cardiffOnlyR2)}
            </span>
          </p>
          <p>
            Trained elsewhere → Cardiff:{" "}
            <span className="text-destructive font-medium tabular-nums">
              {formatSignedR2(summary.cardiffFromElsewhereR2)}
            </span>
          </p>
          <p className="text-muted-foreground mt-2">
            Transfer into Cardiff is markedly worse than the cohort average —
            evidence that a Cardiff-only result should not be presented as
            general.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function CitiesPage() {
  const { data, error, isLoading } = useApi<CitiesListResponse>(
    apiUrl("/api/cities"),
  );

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="cities-loading">
        <Skeleton className="h-24 w-full max-w-3xl" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Alert variant="destructive" data-testid="cities-error">
        <AlertTitle>Could not load cities</AlertTitle>
        <AlertDescription>{error ?? "Cities response was empty"}</AlertDescription>
      </Alert>
    );
  }

  const ranked = rankCitiesByHeldOutR2(data.cities);

  return (
    <div className="space-y-10" data-testid="cities-page">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Cities</h1>
        <p className="text-muted-foreground text-sm">
          Cross-authority transfer — leave-city-out held-out R²
        </p>
      </header>

      <TransferFraming summary={data.transferSummary} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">
          Held-out R² by authority
        </h2>
        <CityTransferChart cities={ranked} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Ranked table</h2>
        <CityTable cities={ranked} />
      </section>
    </div>
  );
}
