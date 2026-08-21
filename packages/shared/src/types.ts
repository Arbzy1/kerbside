export type HealthResponse = {
  status: "ok";
  version: string;
  timestamp: string;
};

export type ApiErrorResponse = {
  error: string;
  message: string;
};

export type VerdictKind =
  | "proven"
  | "suggestive"
  | "disproven"
  | "harmful"
  | "untested"
  | "withdrawn"
  | "city_specific";

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
  city: string | null;
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
  /** Leave-one-city-out R² (coefficient of determination). */
  heldOutR2: number;
  /** Leave-one-city-out r² (squared correlation). */
  heldOutR2Corr: number;
  /** Shared slopes from eleven cities, intercept on ten local counts. */
  local10R2: number;
  createdAt: string;
};

export type ControlDto = {
  id: string;
  experimentId: string | null;
  city: string;
  testName: string;
  configName: string;
  realValue: number;
  nullMean: number;
  nullSd: number;
  nullN: number;
  percentile: number;
  interpretation: string;
  nullDraws: number[];
  category: ControlCategory;
};

export type ControlCategory = "absorption" | "random_weight_gain";

/** Twelve-city transfer headline (K173/K172). Quote r² and R² together. */
export type TransferSummaryDto = {
  nCities: number;
  nPoints: number;
  r2AtK2: number;
  r2AtK11: number;
  r2DetAtK2: number;
  r2DetAtK11: number;
  local10R2: number;
  oracleR2: number;
  envelope: string;
};

export type StudyCityDto = {
  city: string;
  n: number;
  noiseFloorMin: number;
  noiseFloorMax: number;
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
  studyCities: StudyCityDto[];
};

export type ControlsListResponse = {
  controls: ControlDto[];
};

export type AbsorptionLadderResponse = {
  rungs: string[];
  cities: Array<{
    city: string;
    deltas: number[];
    monotonic: boolean;
    endsLe0: boolean;
  }>;
};
