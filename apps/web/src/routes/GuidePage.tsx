import { Link } from "react-router";

export function GuidePage() {
  return (
    <article className="space-y-10" data-testid="guide-page">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">
          Ranking transfers; scale needs a local intercept
        </h1>
        <p className="text-muted-foreground max-w-3xl text-base leading-relaxed">
          MSc dissertation, Cardiff University. Supervisor: Dr Crispin Cooper.
          Calibration against DfT cycle counts on twelve UK cities.
        </p>
      </header>

      <nav
        className="glass-surface motion-interactive rounded-2xl border p-4"
        aria-label="Guide sections"
      >
        <p className="text-sm font-medium">On this page</p>
        <ol className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
          <li><a className="underline underline-offset-2" href="#what-this-is">What this is</a></li>
          <li><a className="underline underline-offset-2" href="#two-numbers">The two numbers</a></li>
          <li><a className="underline underline-offset-2" href="#what-we-tested">What we tested</a></li>
          <li><a className="underline underline-offset-2" href="#headline">Headlines</a></li>
          <li><a className="underline underline-offset-2" href="#two-cities">Cardiff and Rotherham</a></li>
          <li><a className="underline underline-offset-2" href="#did-not-hold">What did not hold</a></li>
          <li><a className="underline underline-offset-2" href="#where-to-click">Where to click</a></li>
        </ol>
      </nav>

      <section id="what-this-is" className="scroll-mt-8 space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">1. What this is</h2>
        <p className="text-foreground max-w-3xl text-base leading-relaxed">
          <span className="font-medium">sDNA</span> scores how a street sits in
          the network. This dissertation asks which published cycling-cost
          settings actually predict{" "}
          <span className="font-medium">DfT cycle counts</span> on UK roads, and
          whether a model trained in some cities still ranks streets in another.
        </p>
        <p className="text-muted-foreground max-w-3xl text-base leading-relaxed">
          Counters are snapped to carriageways on an OSMnx bike network. The
          working set is twelve self-contained cities. London boroughs are a
          contrast, not the working set. Start at{" "}
          <Link to="/cities" className="text-foreground underline underline-offset-2">
            Cities
          </Link>
          {" "}for the transfer numbers;{" "}
          <Link to="/" className="text-foreground underline underline-offset-2">
            Findings
          </Link>{" "}
          lists every claim.
        </p>
      </section>

      <section id="two-numbers" className="scroll-mt-8 space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">2. The two numbers</h2>
        <p className="text-foreground max-w-3xl text-base leading-relaxed">
          <span className="font-medium">r²</span> is ranking: do busy streets
          score above quiet ones?{" "}
          <span className="font-medium">R²</span> is ranking plus level: how
          many cyclists, not only which streets have more. They are related
          exactly by R² = r² − (r − α)² − β². Within a city they barely differ.
          Across cities the gap is the result.
        </p>
        <p className="text-muted-foreground max-w-3xl text-base leading-relaxed">
          Published figures around 0.85 are skill{" "}
          <span className="text-foreground font-medium">inside one city</span>.
          Transfer R² near zero asks a different question: can a model trained
          on other cities predict a new one without seeing its counts? That is
          not a contradiction of the papers.
        </p>
      </section>

      <section id="what-we-tested" className="scroll-mt-8 space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">3. What we tested</h2>
        <ul className="text-foreground max-w-3xl list-disc space-y-2 pl-5 text-base leading-relaxed">
          <li>
            How far the model looks along the network (
            <Link to="/experiments/radius" className="underline underline-offset-2">
              radius
            </Link>
            ).
          </li>
          <li>
            Hills (
            <Link to="/experiments/slope" className="underline underline-offset-2">
              slope
            </Link>
            ) and corners (
            <Link to="/experiments/turn_cost" className="underline underline-offset-2">
              turns
            </Link>
            ).
          </li>
          <li>
            Shops and other places as origin and destination weights (see{" "}
            <Link to="/experiments/radius" className="underline underline-offset-2">
              radius
            </Link>
            ).
          </li>
          <li>
            Cycle lanes from maps (
            <Link
              to="/experiments/cycle_provision#k133_i4_direct_osm"
              className="underline underline-offset-2"
            >
              Cycle provision as routing impedance
            </Link>
            ) versus from{" "}
            <Link
              to="/experiments/cycle_detection#k139b_geometry"
              className="underline underline-offset-2"
            >
              Street View lane detection
            </Link>
            .
          </li>
          <li>Extra off-road links on the same street graph (Cardiff +0.015, on the floor — not a new spec).</li>
          <li>
            PageRank-style scores,{" "}
            <Link to="/experiments/pt_accessibility" className="underline underline-offset-2">
              public transport
            </Link>
            , and whether “who cycles” transfers as a rule.
          </li>
        </ul>
      </section>

      <section id="headline" className="scroll-mt-8 space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">4. Headlines</h2>
        <div className="grid max-w-3xl gap-3 sm:grid-cols-3">
          <div className="glass-surface rounded-2xl border p-4">
            <p className="text-sm font-medium">Ranking transfers</p>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
              Mean held-out r² is already +0.306 at two training cities. It
              plateaus (+0.322 at eleven).
            </p>
          </div>
          <div className="glass-surface rounded-2xl border p-4">
            <p className="text-sm font-medium">Scale needs a local intercept</p>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
              Mean held-out R² stays near +0.033 unless you set an intercept on
              about ten random local counts — that lifts the mean to +0.208. Not
              the busiest ten. It is not uniform: only 7 of 12 cities gain, and
              the gain tracks the level penalty it removes almost exactly
              (r = 0.997).
            </p>
          </div>
          <div className="glass-surface rounded-2xl border p-4">
            <p className="text-sm font-medium">Radius: the narrow envelope is out</p>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
              800 / 1,600 / 3,200 beats the inherited 400 / 800 / 1,600 in 11 of
              12 cities. It is <em>not</em> separable from the wider set
              (+0.003, 95% CI −0.012 to +0.017) — the declared r² tie-break
              picked it.
            </p>
          </div>
        </div>
        <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
          Tables:{" "}
          <Link
            to="/experiments/transfer"
            className="underline underline-offset-2"
          >
            twelve-city transfer
          </Link>
          . Demo the numbers on{" "}
          <Link to="/cities" className="underline underline-offset-2">
            Cities
          </Link>
          .
        </p>
      </section>

      <section id="two-cities" className="scroll-mt-8 space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">
          5. Two cities that make the split visible
        </h2>
        <p className="text-foreground max-w-3xl text-base leading-relaxed">
          <span className="font-medium">Cardiff</span> is the best held-out city:
          ranking and scale both travel (leave-one-out R² +0.441, r² +0.561).
        </p>
        <p className="text-foreground max-w-3xl text-base leading-relaxed">
          <span className="font-medium">Rotherham</span> still ranks streets
          (r² +0.223) while R² collapses (−1.348) because the level is wrong.
          Ranking transferred; scale did not. Both cities stay in every mean.
        </p>
      </section>

      <section id="did-not-hold" className="scroll-mt-8 space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">6. What did not hold</h2>
        <ul className="text-foreground max-w-3xl list-disc space-y-2 pl-5 text-base leading-relaxed">
          <li>
            <span className="font-medium">“These weights encode demand”</span> —
            random fields with the same spatial shape reproduce most of the gain.
            Weighting can help; that demand story does not.
          </li>
          <li>
            <span className="font-medium">PageRank-style scores</span> — they do
            not predict cycle counts here.
          </li>
          <li>
            <span className="font-medium">Street View as impedance</span> — closed
            after three negative rounds. Detection was partly a camera-geometry
            failure, not evidence that cycle lanes do not matter.
          </li>
          <li>
            <span className="font-medium">“Who cycles”</span> can look good inside
            one city; every leave-one-city-out score is negative.
          </li>
          <li>
            <span className="font-medium">The angular coefficient</span> — no
            tested value beats the preset by more than noise. A good default, not
            a miss.
          </li>
          <li>
            <span className="font-medium">Hybrid radius</span> — matching the
            radius metric to the cycle hybrid hurt Cardiff and Bristol. Euclidean
            radius stays.
          </li>
          <li>
            <span className="font-medium">sDNA Learn on nine columns</span> —
            Box-Cox out-of-sample R² +0.49, not the published 0.85. Still a
            smaller model, still a different fold scheme.
          </li>
        </ul>
      </section>

      <section id="where-to-click" className="scroll-mt-8 space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">7. Where to click</h2>
        <ul className="text-foreground max-w-3xl list-disc space-y-2 pl-5 text-base leading-relaxed">
          <li>
            <Link to="/cities" className="underline underline-offset-2">
              Cities
            </Link>{" "}
            — the twelve places and the r² / R² split. Start here in a meeting.
          </li>
          <li>
            <Link to="/" className="underline underline-offset-2">
              Findings
            </Link>{" "}
            — the transfer curve, then every claim.
          </li>
          <li>
            <Link to="/controls" className="underline underline-offset-2">
              Controls
            </Link>{" "}
            — the random-weight check.
          </li>
        </ul>
      </section>

      <details id="details" className="max-w-3xl scroll-mt-8 rounded-2xl border p-4">
        <summary className="cursor-pointer text-sm font-medium">
          Details (verdicts, how Findings is grouped, multiplicity)
        </summary>
        <div className="text-muted-foreground mt-4 space-y-4 text-sm leading-relaxed">
          <p id="reading-a-result">
            <span className="text-foreground font-medium">How to read a result.</span>{" "}
            Leave-one-city-out (LOCO) trains on the other cities and tests the
            held-out one. Each city also has a noise floor: effects smaller than
            that band are treated as unresolvable. Pooled models (all cities at
            once) are useful; check LOCO next to them.
          </p>
          <p>
            <span className="text-foreground font-medium">Verdicts.</span> Proven
            — measured and the checks hold. Suggestive — a clear point estimate,
            interval still crosses zero. City-specific — real in some places, not
            a rule for all. Withdrawn — a claim later retracted. Disproven /
            harmful / untested — as labelled on Findings.
          </p>
          <p>
            <span className="text-foreground font-medium">How Findings is grouped.</span>{" "}
            Research strands keep questions together. Inside each strand, claims
            are banded Held up / City-specific / Did not hold. Switch to “By
            verdict” for a flat list.
          </p>
          <p>
            <span className="text-foreground font-medium">Multiplicity.</span>{" "}
            Many claims carry permutation percentiles. The impedance-null family
            was declared before any p-value was computed. At about 40 draws it
            returned 0 of 6; after 199 draws, 2 of 6 survive — both Manchester
            provision contrasts. Non-survivors are not automatically disproven.
          </p>
        </div>
      </details>
    </article>
  );
}
