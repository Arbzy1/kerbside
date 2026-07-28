import type { VerdictsListResponse } from "@kerbside/shared";
import { apiUrl } from "@/lib/apiBase";
import { useApi } from "@/lib/useApi";
import {
  ScoreboardError,
  ScoreboardLoading,
  ScoreboardView,
} from "./Scoreboard";

export function ScoreboardPage() {
  const verdicts = useApi<VerdictsListResponse>(apiUrl("/api/verdicts"));

  if (verdicts.isLoading) {
    return <ScoreboardLoading />;
  }

  if (verdicts.error || !verdicts.data) {
    return (
      <ScoreboardError
        message={verdicts.error ?? "Verdicts response was empty"}
      />
    );
  }

  return <ScoreboardView verdicts={verdicts.data.verdicts} />;
}
