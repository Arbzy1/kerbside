export const APP_NAME = "kerbside" as const;

/**
 * City-specific empirical noise floors, from K185 (`k185_floors.csv`).
 *
 * These were K53's single-draw partition floors (Cardiff 0.018-0.024, Manchester 0.002-0.005,
 * Bristol 0.004-0.008) until 21 August 2026. K185 recomputed the floor as a DISTRIBUTION over
 * (perturbation pair x seed) rather than one draw of a random quantity, and found the earlier
 * figures unreliable in both directions - Manchester's was understated by 7.4x, Cardiff's
 * overstated. See correction C41.
 *
 * `noiseFloorMin` is the median of that distribution (the typical draw) and `noiseFloorMax` is
 * the 95th percentile (the conservative end). `isBelowNoiseFloor` tests against the max, so the
 * canonical threshold is the p95.
 */
/** Working-set snap n on the K170 bike network (not the older drive extract). */
export const STUDY_CITIES = [
  {
    city: "cardiff",
    label: "Cardiff",
    n: 149,
    noiseFloorMin: 0.0146,
    noiseFloorMax: 0.0158,
  },
  {
    city: "manchester",
    label: "Manchester",
    n: 246,
    noiseFloorMin: 0.0031,
    noiseFloorMax: 0.0056,
  },
  {
    city: "bristol",
    label: "Bristol",
    n: 178,
    noiseFloorMin: 0.0067,
    noiseFloorMax: 0.0108,
  },
] as const;

export type {
  AbsorptionLadderResponse,
  ApiErrorResponse,
  CitiesListResponse,
  CityDto,
  ControlCategory,
  ControlDto,
  ControlsListResponse,
  ExperimentDetailResponse,
  ExperimentDto,
  ExperimentResultsResponse,
  ExperimentsListResponse,
  HealthResponse,
  ModelResultDto,
  StudyCityDto,
  TransferSummaryDto,
  VerdictDto,
  VerdictKind,
  VerdictsListResponse,
} from "./types";
