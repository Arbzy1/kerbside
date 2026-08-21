# K172 — hierarchical intercepts

Declared before scores. 12 groups: 9 random slopes not identified, not run.
Local intercept = 10 counts, intercept only. Westminster out (D47).
Rotherham stays in every mean (D49).

Runtime 1.3 min. Working set: cardiff, manchester, bristol, birmingham, glasgow, liverpool, sheffield, wakefield, rotherham, wigan, edinburgh, nottingham

## C1 — pooled spatial OOF

- no city FE: R²=+0.2529  r²=+0.2538  amp=0.0009  lvl=0.0000
- city FE (train rows only): R²=+0.3728  r²=+0.3739  amp=0.0008  lvl=0.0002
- **C1 supported** (need mean β² < 0.02 and |R²−r²| < 0.05).
  Pooled no-FE already had β² ≈ 0 — city means wash out in a pooled score. FE still
  lifts R² by **+0.120** by fitting city means (the in-sample version of C2).
  Pooled R² is not comparable to K173's LOCO mean.

## C2/C3/C4 — LOCO shared slopes × intercept

| held | n | prior R² | local10 R² | oracle R² | cov R² | within R² | prior r² | local10 r² |
|---|---:|---------:|-----------:|----------:|-------:|----------:|---------:|-----------:|
| cardiff | 149 | +0.4408 | +0.3875 | +0.4477 | +0.3510 | +0.5502 | +0.5606 | +0.5560 |
| manchester | 246 | +0.0089 | +0.2976 | +0.3416 | -0.0823 | +0.3077 | +0.3501 | +0.3542 |
| bristol | 178 | -0.0408 | +0.2797 | +0.3193 | +0.2028 | +0.2853 | +0.3258 | +0.3309 |
| birmingham | 345 | +0.2531 | +0.2420 | +0.3631 | +0.2538 | +0.2274 | +0.3633 | +0.3648 |
| glasgow | 200 | +0.2297 | +0.2215 | +0.2880 | +0.2330 | +0.1879 | +0.3036 | +0.2967 |
| liverpool | 273 | -0.0795 | +0.1586 | +0.1998 | +0.1996 | +0.2115 | +0.2623 | +0.2629 |
| sheffield | 189 | +0.1841 | +0.2062 | +0.2568 | +0.2167 | +0.1134 | +0.2692 | +0.2650 |
| wakefield | 172 | +0.0543 | +0.1204 | +0.1986 | +0.1275 | +0.0959 | +0.2790 | +0.2747 |
| rotherham | 166 | -1.3483 | -0.0490 | +0.1049 | -0.7630 | +0.1772 | +0.2231 | +0.2177 |
| wigan | 140 | +0.1419 | +0.0991 | +0.1794 | +0.1760 | +0.2108 | +0.2564 | +0.2547 |
| edinburgh | 129 | +0.2431 | +0.1838 | +0.2574 | -0.0326 | +0.0791 | +0.2599 | +0.2576 |
| nottingham | 147 | +0.3030 | +0.3506 | +0.4040 | +0.3998 | -0.1039 | +0.4064 | +0.4060 |

Means: prior R² +0.0325 · local10 +0.2082 · oracle +0.2800 · cov +0.1068 · prior r² +0.3217 · local10 r² +0.3201 · within r² +0.2391.

- **C2 supported** — local10 vs prior Δ = +0.1756 (need > 0.05). oracle_int is an upper bound, not transfer.
- **C3 supported** — mean (within r² − local10 r²) = -0.0810 (need ≤ 0.05).
- **C4 covariates beat prior** — cov vs prior Δ = +0.0743 (null if ≤ 0.02).

Coefficient cosine vs grand mean: 0.483; sign agreement 0.667. Descriptive only.

C4 beats the prior on average but **loses on Rotherham (−0.763), Manchester (−0.082) and
Edinburgh (−0.033)**. log(n)+span is not a substitute for a local intercept. local10 is
not uniformly better either: it *hurts* Cardiff, Birmingham, Glasgow, Wigan and Edinburgh,
where the prior level penalty was already small. The mean gain is carried by
Manchester / Bristol / Liverpool / Rotherham / Nottingham.

S3 stays blocked (D49). C3 passed, so K174 is not gated by this file.

Wrote `k172_pooled.csv`, `k172_loco.csv`, `k172_coefs.csv`.
