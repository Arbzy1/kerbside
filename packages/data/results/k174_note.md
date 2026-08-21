# K174 — radius LOCO

Declared before scores. Three matched-k envelopes already on disk (K171).
Within-city z-score (k80:334). Westminster out. No new sDNA.

Runtime 1.6 min. Working set: cardiff, manchester, bristol, birmingham, glasgow, liverpool, sheffield, wakefield, rotherham, wigan, edinburgh, nottingham

## Mean LOCO (train 11, predict 1)

| arm | radii | mean R² | mean r² |
|---|---|---:|---:|
| rad_narrow | 400,800,1600 | +0.0079 | +0.3003 |
| baseline | 800,1600,3200 | +0.0325 | +0.3217 ← winner on r² |
| rad_wide | 1600,3200,6400 | +0.0388 | +0.3190 |

**C1 supported** — transferable envelope is `baseline` (800,1600,3200) on mean LOCO r².
Mean LOCO **R²** would pick `rad_wide` (+0.0388 vs baseline +0.0325); that arm was not the
tie-break. The gap is Rotherham's level penalty (wide −1.298 vs baseline −1.348).

## Within-city R² winner per city

| city | winner | narrow R² | baseline R² | wide R² |
|---|---|---:|---:|---:|
| cardiff | baseline | +0.4403 | +0.5502 | +0.5491 |
| manchester | rad_narrow | +0.3178 | +0.3077 | +0.3041 |
| bristol | baseline | +0.2305 | +0.2853 | +0.2682 |
| birmingham | rad_narrow | +0.3147 | +0.2274 | +0.1540 |
| glasgow | rad_wide | +0.1734 | +0.1879 | +0.1925 |
| liverpool | rad_narrow | +0.2293 | +0.2115 | +0.1779 |
| sheffield | baseline | +0.0901 | +0.1134 | +0.0357 |
| wakefield | rad_wide | +0.1036 | +0.0959 | +0.1373 |
| rotherham | rad_wide | +0.1526 | +0.1772 | +0.2072 |
| wigan | rad_wide | +0.1839 | +0.2108 | +0.2592 |
| edinburgh | rad_wide | +0.0401 | +0.0791 | +0.0818 |
| nottingham | rad_narrow | +0.0597 | -0.1039 | -0.1391 |

**C2 supported** — 3 distinct within-city winners; the envelope is city-specific inside a city and (C1) one envelope is asked to transfer.

City-extension plan closes after this file (D51). No S3. No more OSM extracts.

Wrote `k174_within.csv`, `k174_loco.csv`.
