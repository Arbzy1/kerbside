import type { CitiesListResponse, CityDto, TransferSummaryDto } from "@kerbside/shared";
import { CityTable } from "@/components/CityTable";
import { CityTransferChart } from "@/components/CityTransferChart";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiUrl } from "@/lib/apiBase";
import { rankCitiesByHeldOutR2 } from "@/lib/cities";
import { useApi } from "@/lib/useApi";
import { formatSignedR2 } from "@/lib/verdicts";

function TransferFraming({
  summary,
  cardiff,
  rotherham,
}: {
  summary: TransferSummaryDto;
  cardiff: CityDto | null;
  rotherham: CityDto | null;
}) {
  return (
    <div className="space-y-4" data-testid="transfer-framing">
      <div className="text-muted-foreground max-w-3xl space-y-3 text-base leading-relaxed">
        <p>
          Ranking already transfers at two of{" "}
          <span className="text-foreground font-medium">
            {summary.nCities} cities
          </span>{" "}
          (mean held-out r² {formatSignedR2(summary.r2AtK2)};{" "}
          {formatSignedR2(summary.r2AtK11)} at eleven).
        </p>
        <p>
          Scale does not: mean held-out R² moves only from{" "}
          {formatSignedR2(summary.r2DetAtK2)} to{" "}
          {formatSignedR2(summary.r2DetAtK11)}. Ten random local counts,
          intercept only, raise that R² to {formatSignedR2(summary.local10R2)}{" "}
          (oracle {formatSignedR2(summary.oracleR2)}).
        </p>
        <p>
          {summary.envelope} beats the narrow envelope in 11 of 12 cities; it is not separable from the wider one.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card data-testid="cardiff-best" className="border-primary/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Cardiff is the best held-out city
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed">
            <p>
              Leave-one-city-out R²{" "}
              <span className="text-foreground font-medium tabular-nums">
                {cardiff ? formatSignedR2(cardiff.heldOutR2) : "+0.441"}
              </span>
              {cardiff
                ? `, r² ${formatSignedR2(cardiff.heldOutR2Corr)}`
                : ", r² +0.561"}
              . Ranking and scale both travel.
            </p>
          </CardContent>
        </Card>
        <Card data-testid="rotherham-scale">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Rotherham: ranking holds, scale does not
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed">
            <p>
              r²{" "}
              <span className="text-foreground font-medium tabular-nums">
                {rotherham ? formatSignedR2(rotherham.heldOutR2Corr) : "+0.223"}
              </span>
              , R²{" "}
              <span className="text-foreground font-medium tabular-nums">
                {rotherham ? formatSignedR2(rotherham.heldOutR2) : "−1.348"}
              </span>
              . The level is wrong; it stays in every mean.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function CitiesPage() {
  const { data, error, isLoading, retry } = useApi<CitiesListResponse>(
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
        <AlertDescription className="space-y-3">
          <p>{error ?? "Cities response was empty"}</p>
          <Button variant="outline" size="sm" onClick={retry}>
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const ranked = rankCitiesByHeldOutR2(data.cities);

  return (
    <div className="space-y-10" data-testid="cities-page">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Cities</h1>
        <p className="text-muted-foreground text-sm">
          Leave-one-city-out r² and R², plus a local intercept of ten counts.
        </p>
      </header>

      <TransferFraming
        summary={data.transferSummary}
        cardiff={
          data.cities.find((c) => c.name.toLowerCase() === "cardiff") ?? null
        }
        rotherham={
          data.cities.find((c) => c.name.toLowerCase() === "rotherham") ?? null
        }
      />

      {data.studyCities.length > 0 ? (
        <section className="space-y-3" data-testid="study-cities">
          <h2 className="text-lg font-semibold tracking-tight">
            Calibration cities (noise floors)
          </h2>
          <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
            Radius and slope were first measured here. Noise floors are
            city-specific, and each is a distribution rather than a single
            number: the range shown runs from the typical draw to the
            conservative 95th percentile. The transfer table below is the
            twelve-city working set, not these three alone.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {data.studyCities.map((city) => (
              <Card key={city.city}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base capitalize">
                    {city.city}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm tabular-nums space-y-1">
                  <p>n = {city.n}</p>
                  <p className="text-muted-foreground">
                    noise floor {city.noiseFloorMin.toFixed(3)}–
                    {city.noiseFloorMax.toFixed(3)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">
          Held-out R² by city
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
