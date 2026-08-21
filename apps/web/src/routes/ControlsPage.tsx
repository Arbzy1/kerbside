import type { ControlsListResponse } from "@kerbside/shared";
import { ControlNullChart } from "@/components/ControlNullChart";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiUrl } from "@/lib/apiBase";
import { useApi } from "@/lib/useApi";

export function ControlsPage() {
  const { data, error, isLoading, retry } = useApi<ControlsListResponse>(
    apiUrl("/api/controls"),
  );

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="controls-loading">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Alert variant="destructive" data-testid="controls-error">
        <AlertTitle>Could not load controls</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{error ?? "Controls response was empty"}</p>
          <Button variant="outline" size="sm" onClick={retry}>
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const absorption = data.controls.filter((c) => c.category === "absorption");
  const gains = data.controls.filter((c) => c.category === "random_weight_gain");

  return (
    <div className="space-y-10" data-testid="controls-page">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Controls</h1>
        <p className="text-muted-foreground max-w-3xl text-base leading-relaxed">
          Each chart puts the real weights on a random-weight null. Weighting
          the assignment can help; these particular “demand” weights are not
          what makes it work.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">
          POI absorption
        </h2>
        <div className="grid gap-4">
          {absorption.map((control) => (
            <ControlNullChart key={control.id} control={control} />
          ))}
          {absorption.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No POI absorption controls are available yet.
            </p>
          ) : null}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">
          Random-weight gain
        </h2>
        <div className="grid gap-4">
          {gains.map((control) => (
            <ControlNullChart key={control.id} control={control} />
          ))}
          {gains.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No random-weight gain controls are available yet.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
