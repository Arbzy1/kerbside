# K173 — transferability law

Declared before scores: shuffled-city null = permute y within each **training**
city; held-out y untouched. 99 perms, Phipson–Smyth. Westminster out (D47).

Working set (12): cardiff, manchester, bristol, birmingham, glasgow, liverpool, sheffield, wakefield, rotherham, wigan, edinburgh, nottingham
Runtime 20.3 min. Real exhaustive fits 24432. Null 99 × 20 draws/cell.

## Curve (mean over held-out cities)

| k | R² | r² | null R² | p_R² | null r² | p_r² |
|--:|---:|---:|--------:|-----:|--------:|-----:|
| 2 | -0.0853 | +0.3061 | -0.3363 | 0.010 | +0.2156 | 0.010 |
| 3 | -0.0399 | +0.3110 | -0.3006 | 0.010 | +0.2117 | 0.010 |
| 4 | -0.0160 | +0.3141 | -0.2845 | 0.010 | +0.2100 | 0.010 |
| 5 | -0.0013 | +0.3161 | -0.2717 | 0.010 | +0.2038 | 0.010 |
| 6 | +0.0088 | +0.3175 | -0.2632 | 0.010 | +0.2015 | 0.010 |
| 7 | +0.0160 | +0.3186 | -0.2592 | 0.010 | +0.1979 | 0.010 |
| 8 | +0.0216 | +0.3195 | -0.2550 | 0.010 | +0.1936 | 0.010 |
| 9 | +0.0260 | +0.3203 | -0.2507 | 0.010 | +0.1904 | 0.010 |
| 10 | +0.0296 | +0.3210 | -0.2488 | 0.010 | +0.1878 | 0.010 |
| 11 | +0.0325 | +0.3217 | -0.2467 | 0.010 | +0.1847 | 0.030 |

## Claim readings (pre-declared)

- **Rises (R²):** ρ(k, mean R²) = +1.000, p_PS = 0.040 (supported).
- **Rises (r²):** ρ(k, mean r²) = +1.000, p_PS = 0.050 (not supported).
- **Plateau (R²):** k* = 7.
- **Plateau (r²):** k* = 2.

## k=11 LOCO (train on 11, predict 1)

| held | n | LOCO R² | LOCO r² | ensemble R² | within R² |
|---|---:|--------:|--------:|------------:|----------:|
| cardiff | 149 | +0.4408 | +0.5606 | +0.4406 | +0.5502 |
| manchester | 246 | +0.0089 | +0.3501 | +0.0094 | +0.3077 |
| bristol | 178 | -0.0408 | +0.3258 | -0.0429 | +0.2853 |
| birmingham | 345 | +0.2531 | +0.3633 | +0.2539 | +0.2274 |
| glasgow | 200 | +0.2297 | +0.3036 | +0.2296 | +0.1879 |
| liverpool | 273 | -0.0795 | +0.2623 | -0.0807 | +0.2115 |
| sheffield | 189 | +0.1841 | +0.2692 | +0.1836 | +0.1134 |
| wakefield | 172 | +0.0543 | +0.2790 | +0.0587 | +0.0959 |
| rotherham | 166 | -1.3483 | +0.2231 | -1.3458 | +0.1772 |
| wigan | 140 | +0.1419 | +0.2564 | +0.1417 | +0.2108 |
| edinburgh | 129 | +0.2431 | +0.2599 | +0.2437 | +0.0791 |
| nottingham | 147 | +0.3030 | +0.4064 | +0.3028 | -0.1039 |

Covariates vs k=11 LOCO R²: median cycles ρ=+0.01 p=0.97; n ρ=-0.32 p=0.32; span ρ=-0.13 p=0.70.

Rotherham's k=11 LOCO R² −1.348 is a **level** penalty (β² 1.453) with r² still +0.223. It
dominates the mean R² and is **not dropped**. Nottingham's own-city R² −0.104 becomes LOCO
+0.303 — scale learned elsewhere transfers in.

S3 is not unblocked (D49). Next compute is K172 (city-level intercepts), not more core-9 cities.

Wrote `k173_curve.csv`, `k173_held.csv`, `k173_loco11.csv`, `k173_within.csv`.
