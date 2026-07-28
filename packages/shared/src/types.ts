export type HealthResponse = {
  status: "ok";
  version: string;
  timestamp: string;
};

export type ApiErrorResponse = {
  error: string;
  message: string;
};

export type VerdictKind = "proven" | "disproven" | "harmful" | "untested";

export type ExperimentDto = {
  id: string;
  slug: string;
  title: string;
  question: string;
  methodNote: string;
};

export type ModelResultDto = {
  id: string;
  experimentId: string;
  modelName: string;
  k: number | null;
  randomR2: number | null;
  spatialR2: number | null;
  locoR2: number | null;
  n: number | null;
  notes: string;
};

export type VerdictDto = {
  id: string;
  experimentId: string | null;
  experimentSlug: string | null;
  claim: string;
  verdict: VerdictKind;
  evidence: string;
};

export type CityDto = {
  id: string;
  name: string;
  laCode: string;
  country: string;
  nCountPoints: number;
  heldOutR2: number;
  createdAt: string;
};

/** Cross-city transfer headline figures from exp5_transfer_summary.csv */
export type TransferSummaryDto = {
  withinCityR2: number;
  acrossCityR2: number;
  transferPenalty: number;
  cohortNPoints: number;
  cohortNAuthorities: number;
  cardiffOnlyR2: number;
  cardiffFromElsewhereR2: number;
  cardiffNPoints: number;
};

export type ExperimentsListResponse = {
  experiments: ExperimentDto[];
};

export type ExperimentDetailResponse = {
  experiment: ExperimentDto;
};

export type ExperimentResultsResponse = {
  experiment: ExperimentDto;
  results: ModelResultDto[];
};

export type VerdictsListResponse = {
  verdicts: VerdictDto[];
};

export type CitiesListResponse = {
  cities: CityDto[];
  transferSummary: TransferSummaryDto;
};
