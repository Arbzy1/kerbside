# Results package — for updating the website

**Regenerated 14 August 2026 (K172–K174 added).** Everything the Application needs to be brought current
is here.

## Start with one file

**`WEBSITE_EXPORT.json`** — **38 claims**, each with:

```
id · title · verdict · summary · numbers{} · evidence[] · chapter · caveat
```

plus two top-level keys added on 6 August:

```
superseded[]      · claims replaced by a newer one, and what to do with the old row
standing_warning  · the radius caveat that applies across the whole export
```

Every value in `numbers` is **read live from the CSV named in `evidence`**, not restated by hand.
Regenerate at any time:

```bash
python tools/export_for_web.py
```

If a result CSV changes, re-running picks it up. Nothing in the export can silently drift from
its evidence — that discipline exists because this project shipped a claim once (C17/K75) where a
script had been patched and its CSV never regenerated.

## Verdict vocabulary

`proven` · `suggestive` · `city_specific` · `disproven` · `withdrawn` · `harmful` · `untested`

✅ **No schema change is needed.** All seven values are already present in both
`apps/api/src/db/schema.ts` (`verdictKindEnum`) and `packages/shared/src/types.ts`
(`VerdictKind`). *(An earlier version of this file warned that `suggestive` was missing. It has
since been added — that warning is obsolete.)*

---

## 🔴 Read this before seeding: one deployed claim is now WRONG

The live site carries **`slope_ladder`** as **proven**, titled *"sDNA's published slope
calibration is not optimal for Cardiff"*, saying **Cardiff wants a steeper slope response than the
default**.

**That has reversed.** K96 swept the slope ladder with radius fixed at `400,800,1600` — the
envelope the radius result had just shown to be sub-optimal. Re-run at `800,1600,3200`, Cardiff's
`_s=4` arm goes from **+0.017 (better than preset) to −0.016 (worse)**, both ends clear of
Cardiff's noise floor, and Cardiff's optimum returns to **the preset**.

**What to do:**

| | |
|---|---|
| `slope_ladder` | keep the row, re-render as **`withdrawn`** with its new title and summary |
| `slope_calibration` | **new** — the current slope claim, `city_specific` |
| `slope_x_radius` | **new** — the 2×2, `proven` |
| `argmax_not_optimum` | **new** — the methods finding, `proven` |

### A second withdrawal, same shape

`multimodal_placebo` is **new and `withdrawn`**. K93 recorded that the multimodal build had
perturbed the road network; its placebo varied network *and* metric together. Held fixed, the
build moves cycle-flow prediction by **+0.004 — inside Cardiff's floor** — while the metric alone
accounts for **−0.126**. The build is exonerated. `superseded[]` carries this too, pointing at
`multimodal`, which keeps the method result and the n=26 limitation.

### Three further new claims

| | |
|---|---|
| `radius_per_city` | `city_specific` — **the radius optimum differs in all three cities** and the pooled one fits Bristol only. Cardiff `1600,3200,6400`, Manchester the project default |
| `nqpdd_decay` | `city_specific` — sDNA's one continuous decay parameter is **real and mis-set**; the published null was diluted by six unresponsive columns |
| `plateau_audit` | `proven` — **11 of 26 ladders are plateaux, not point optima**. Quote it whenever the UI shows an "optimum" |

⚠️ **Do not delete `slope_ladder`.** The withdrawal *is* the finding, and quietly dropping a claim
the site has already published is precisely how a stale number survives. The `superseded[]` array
in the export encodes this instruction machine-readably.

---

## What else changed since the last seed

1. **The radius headline now ships with a caveat it did not have.** Scored *within* each city at
   the preset exponent, the wider envelope helps Cardiff (+0.088) and Bristol (+0.028) but
   **hurts Manchester (−0.069, 91× its floor)** — the largest radius effect measured anywhere, in
   the wrong direction. It is the better **transferable** configuration (which is what LOCO and
   the credible interval measure), not the best choice for every city alone. Six new
   `within_*` numbers on the `radius` claim carry this; the caveat text states it.
2. **Slope and radius are additive** (interaction −0.003), where radius and attractor weighting
   were strongly sub-additive (−0.052 LOCO). The two gains stack: best configuration in the
   project is **+0.532 pooled / +0.426 LOCO**.
3. **A new methods claim.** `argmax_not_optimum` — an argmax is only an optimum if it clears its
   neighbours by more than the noise floor. Cardiff's slope "peak" at `_s=4` did not: everything
   from 3 to 6 sat inside its floor. Bristol *does* have a genuine point optimum at `_s=1.5`.
   The difference is sample size, not terrain.

Still true from the previous update: the headline is **radius**, not attractor weighting (whose
interval includes zero); the two are largely the same lever; and two established claims are
radius-dependent (K88).

### 14 August — twelve-city transfer (K172–K174)

Three new claims, all from existing K170/K171 arms (no new sDNA):

| claim | verdict | do not quote |
|---|---|---|
| `transfer_law` | proven | “models do not transfer”; R² without r² |
| `local_intercept` | proven | in-sample pooled city-FE +0.37 as transfer |
| `radius_twelve` | city_specific | “wide wins” |

Seed mapping: `transfer_law` / `local_intercept` → experiment `transfer`; `radius_twelve` → `radius`. Copy this folder’s `WEBSITE_EXPORT.json` plus the K172–K174 CSVs into `Application/packages/data/results/` (already done 14 Aug), then re-seed.

## ⚠️ The standing warning, also machine-readable in the export

> **Any claim measured at `radii=400,800,1600` is provisional until re-tested at
> `800,1600,3200`.**

That one fixed parameter has now overturned or qualified **four** results. Claims in this export
still resting on it: **`turn_cost`**, **`demand_null`**, and the band-edge families inside
`slope_calibration`. They are published because they are the best current evidence, not because
they are settled. If the site has a "provisional" or "under re-test" affordance, these are the
rows for it.

## Files by claim

| claim | evidence CSVs |
|---|---|
| radius · sub_additive | `k80_radius_pooled.csv` · `k80_radius_loco.csv` · `k80b_factorial.csv` · `k80b_decomposition.csv` · `k97_slope_x_radius.csv` |
| **transfer_law** | **`k173_curve.csv`** · **`k173_loco11.csv`** · **`k173_note.md`** |
| **local_intercept** | **`k172_loco.csv`** · **`k172_pooled.csv`** · **`k172_note.md`** |
| **radius_twelve** | **`k174_loco.csv`** · **`k174_within.csv`** · **`k174_note.md`** |
| decay_curve | `k80_decay_curve.csv` |
| weighting · demand_null | `k80b_factorial.csv` · `k55_null_cardiff.csv` · `k55_null_manchester.csv` · `k84_posterior.csv` |
| **slope_calibration · argmax_not_optimum** | **`k97_slope_x_radius.csv`** |
| **slope_x_radius** | **`k97_decomposition.csv`** · **`k97_factorial.csv`** |
| **slope_ladder** *(withdrawn)* | `k96_slope_ladder.csv` · `k97_slope_x_radius.csv` |
| turn_cost | `k81_turn_sweep.csv` |
| gva_pedestrian · gva_config_specific | `k82_gva_walk.csv` · `k82_gva_contrasts.csv` |
| elevation | `k83_elevation_slope.csv` · `k83_dose_*.csv` |
| mode_share | `k85_mode_share.csv` |
| radius_robustness | `k88_slope_by_radius.csv` · `k88_endpoint_by_radius.csv` |
| pagerank_pedestrian | `k89_walk_pagerank_pt.csv` |
| rail_usage | `k90_rail_usage.csv` |
| estimator · cardiff_limit | `k91_noise_floor.csv` |
| recovered_verdicts | `k94_pooled_rescore.csv` |
| multimodal | `k93_multimodal.csv` · `k93_placebo.csv` |
| *(uncertainty on the headline contrasts)* | `k84_posterior.csv` |

Each CSV has a matching `.log` in the same folder with the full run output, including the gates
that were checked. `k97_slope_x_radius.log` prints all four of its gates.

## Context documents

| file | what |
|---|---|
| `../grok3rdaugust/PRESENTABLE_CLAIMS.md` | 🔴 **the authority** — quote / don't-quote register |
| `../docs/16_decisions_and_corrections.md` | **C23** explains the slope withdrawal in full |
| `../Write up/CH4_draft.md` | the results chapter, written from this export's evidence |
| `../Write up/BRIEF_LINE_AUDIT.md` | every line of the supervisor's brief, mapped to K-numbers |
| `../NEXT_STEPS.md` | what is done, what is blocked and on whom, what is next |
| `K75_regeneration_findings.md` | the verification pass that reordered several claims |

## Three things not to do

- **Do not quote a number without its caveat.** Several claims are correct only with a qualifier
  attached — the turn-cost result is partly a road-hierarchy proxy, the rail result has a circular
  weight field, the radius gain does not hold within Manchester. The `caveat` field is populated
  for exactly this reason.
- **Do not present withdrawn claims as findings — and do not hide them either.** `demand_null` and
  `slope_ladder` are *withdrawals*. They belong on the site as retracted claims. That record is a
  feature of this project, not something to tidy away.
- **Do not hand-edit `WEBSITE_EXPORT.json`.** Change `tools/export_for_web.py` and regenerate, so
  the numbers keep coming from the CSVs. Hand-editing reintroduces exactly the drift the export
  exists to prevent.
