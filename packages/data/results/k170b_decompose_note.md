# K170b — Murphy decompose of existing K170 arms

No rebuild. Questions declared in the script docstring before this file was written.

| city | R² | r² | amp | level | dominant | n | median cycles |
|---|---:|---:|---:|---:|---|---:|---:|
| cardiff | +0.5502 | +0.5526 | 0.0005 | 0.0019 | level | 149 | 45 |
| manchester | +0.3077 | +0.3077 | 0.0000 | 0.0000 | amplitude | 246 | 146 |
| bristol | +0.2853 | +0.2917 | 0.0038 | 0.0026 | amplitude | 178 | 134 |
| birmingham | +0.2274 | +0.2456 | 0.0162 | 0.0020 | amplitude | 345 | 42 |
| glasgow | +0.1879 | +0.2050 | 0.0047 | 0.0124 | level | 200 | 26 |
| westminster | -0.1869 | +0.0305 | 0.1820 | 0.0354 | amplitude | 147 | 1366 |
| liverpool | +0.2115 | +0.2212 | 0.0010 | 0.0086 | level | 273 | 102 |
| sheffield | +0.1134 | +0.1755 | 0.0317 | 0.0304 | amplitude | 189 | 37 |
| wakefield | +0.0959 | +0.1544 | 0.0585 | 0.0000 | amplitude | 172 | 40 |
| rotherham | +0.1772 | +0.2021 | 0.0239 | 0.0009 | amplitude | 166 | 15 |
| wigan | +0.2108 | +0.2126 | 0.0017 | 0.0000 | amplitude | 140 | 43 |
| edinburgh | +0.0791 | +0.1525 | 0.0573 | 0.0160 | amplitude | 129 | 67 |
| nottingham | -0.1039 | +0.1488 | 0.2006 | 0.0521 | amplitude | 147 | 116 |

## Declared questions

**Nottingham** R² -0.1039, r² +0.1488: the gap is **amplitude** (amp 0.2006, level 0.0521).
**Westminster** r² +0.0305 — still essentially uncorrelated with flow.
**S2 r² > 0.05:** 7 of 7.

Spearman of R² against covariates on non-Westminster cities (null is a result):

| covariate | ρ | p |
|---|---:|---:|
| median_pedal_cycles | +0.315 | 0.319 |
| n | +0.455 | 0.138 |
| span_km | -0.259 | 0.417 |

No mechanism is attached to any of these numbers. Source: `results/k170b_decompose.csv`.
