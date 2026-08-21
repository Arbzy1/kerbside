import type {
  AbsorptionLadderResponse,
  ExperimentResultsResponse,
  VerdictsListResponse,
} from "@kerbside/shared";
import { apiUrl } from "@/lib/apiBase";
import { useApi } from "@/lib/useApi";
import {
  ScoreboardError,
  ScoreboardLoading,
  ScoreboardView,
} from "./Scoreboard";

const STANDING_WARNING =
  "Claims measured only at 400 / 800 / 1,600 m stay provisional until the wider envelope; that setting already overturned or qualified five results. Some reported optima are plateaux, not point estimates. Check the plateau audit before quoting a single number.";

export function ScoreboardPage() {
  const verdicts = useApi<VerdictsListResponse>(apiUrl("/api/verdicts"));
  const ladder = useApi<AbsorptionLadderResponse>(apiUrl("/api/ladder"));
  const radius = useApi<ExperimentResultsResponse>(
    apiUrl("/api/experiments/radius/results"),
  );
  const transfer = useApi<ExperimentResultsResponse>(
    apiUrl("/api/experiments/transfer/results"),
  );

  if (verdicts.isLoading) {
    return <ScoreboardLoading />;
  }

  if (verdicts.error || !verdicts.data) {
    return (
      <ScoreboardError
        message={verdicts.error ?? "Verdicts response was empty"}
        onRetry={verdicts.retry}
      />
    );
  }

  return (
    <ScoreboardView
      verdicts={verdicts.data.verdicts}
      ladder={ladder.data}
      radiusResults={radius.data?.results ?? null}
      transferResults={transfer.data?.results ?? null}
      isLadderLoading={ladder.isLoading}
      isRadiusLoading={radius.isLoading}
      isTransferLoading={transfer.isLoading}
      standingWarning={STANDING_WARNING}
      warnings={[
        ...(ladder.error
          ? ["The absorption ladder could not be loaded. Try refreshing the page."]
          : []),
        ...(radius.error
          ? ["The headline radius charts could not be loaded. Try refreshing the page."]
          : []),
        ...(transfer.error
          ? ["The twelve-city transfer curve could not be loaded. Try refreshing the page."]
          : []),
      ]}
      onRetrySupporting={() => {
        ladder.retry();
        radius.retry();
        transfer.retry();
      }}
    />
  );
}
