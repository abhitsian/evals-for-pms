# Chapter 8 — Managing Eval Datasets

## In one line
Your eval suite is only as good as the dataset it runs on — this chapter teaches PMs how to seed, grow, balance, label, split, and govern the reference dataset of traces so that every eval number you report actually means something.

## Why it matters for PMs
The dataset is the single most underinvested part of most eval systems. The common failure pattern: a team builds a few well-designed judges and code evals, runs them against ~30 traces that were hand-picked during prototyping, and then treats the pass rates as authoritative — when those numbers measure performance on easy, well-formatted inputs that look nothing like the messy messages real users send. The result is a confident-looking metric that is silently meaningless. For a PM, this is the most dangerous kind of number: it survives a product review, it gates a launch decision, and it is wrong. Owning the dataset is how a PM keeps the entire eval program honest — every downstream judge, every confusion-matrix calibration, every "we improved 5 points" claim inherits the quality (or rot) of the dataset underneath it.

## Core concepts
- **The dataset is the foundation.** Every eval result is only as trustworthy as the dataset it runs on. A dataset that doesn't reflect production traffic produces metrics that look good and mean nothing.
- **The three dataset mistakes that destroy eval validity:**
  1. **Unrepresentative data** — if the dataset doesn't represent the distribution of inputs your agent handles *poorly* in production, every number you compute on it is suspect.
  2. **Incorrectly labeled data** — if it isn't labeled correctly, your LLM judge (next module) is calibrated against noise, not signal.
  3. **Never refreshed** — if it never gets refreshed, your evals gradually measure a version of the product that no longer exists.
- **Trace** — the unit of a dataset. A record of a user input plus the agent's full output (including tool calls and intermediate reasoning).
- **Eval dataset (reference dataset)** — a curated collection of representative traces, labeled with ground-truth verdicts for specific quality criteria, used to measure the performance of code evals and LLM judges.
- **Golden outputs** — ideal, human-verified responses produced during the vibe-check stage; they double as traces and define what "good" looks like for a set of inputs.
- **Train / Dev / Test split** — dividing labeled data into three non-overlapping buckets: a small train set (few-shot examples in the judge prompt), a dev set (iteration/debugging), and a held-out test set (final blind validation).
- **Dataset contamination** — when test-set information leaks into the judge prompt or calibration process, inflating accuracy metrics beyond what the judge achieves on genuinely unseen data.
- **Dataset versioning** — tracking every addition, removal, and relabel over time so evaluation is reproducible and comparable across experiments.
- **Eval-first EAP** — an Early Access Program structured for edge-case discovery and dataset building rather than feature validation; its deliverable is labeled examples and documented failure modes, not testimonials.

## The mental model — how to think about this
Think of the dataset as a **lens** through which you observe your agent. A clean, easy, prototype-only dataset is a fish-eye lens pointed at the happy path — it shows you a flattering, distorted picture. The job is to grind that lens until it faithfully shows the production reality, *especially the hard parts of it*.

Two principles do most of the work:

1. **Mirror difficulty, not frequency.** Production is mostly easy traffic the agent already handles. If you sample by frequency you'll fill the dataset with cases you already pass — and learn nothing. Deliberately over-weight the hard tail (edge cases, ambiguity, multi-intent, adversarial inputs). The marginal value of your 501st routine billing ticket is near zero; the marginal value of your first scanned PDF with handwriting is high.
2. **The synthetic-to-production transition is the single most important dataset event.** Pre-launch you only have a clean, well-formatted internal dataset built from the use cases the team was already thinking about. Production data is messy, surprising, and humbling. Teams that never make this transition are running evals against a fantasy version of their product. Plan for the transition from day one.

The whole discipline reduces to: keep the lens pointed at reality, keep it pointed at the parts of reality that hurt, and never let the lens get contaminated by the thing it's supposed to measure.

## Key frameworks / steps / loops

**Anatomy of a dataset row** — every row carries the same core fields so evals can run programmatically and results compare across experiments:
- **User input** — the original query, ticket, or request that triggered the agent.
- **Agent output** — the full response, including structured fields, tool calls, and intermediate reasoning.
- **Reference / ground truth (if available)** — for reference-based judges, the retrieved context or golden output to compare against; for code evals that check against input data (e.g. a hallucination guard), the input data the eval needs.
- **Human label (Pass/Fail)** — **one label per evaluation criterion / trace code.** A single row can carry separate labels for empathy, actionability, factual grounding, etc.
- **Notes** — free-text annotation for borderline cases, labeler reasoning, or context future reviewers will need.

**Dataset size minimums (and why):**
- **30–50 labeled examples** — minimum seed set from vibe checks and trace analysis; covers the happy path plus the failure modes you already know about.
- **100+** — needed for meaningful, stable offline eval pass rates. Below 50, a single trace flipping pass→fail swings the rate by 2+ percentage points.
- **200+** — required for reliable judge calibration: enough to split into train/dev/test and still compute valid TPR/TNR per bucket. Below 100, confidence intervals on calibration metrics are too wide to act on.
- **Quality over quantity** — 50 diverse, well-labeled examples beat 500 that oversample easy cases.

**Train / Dev / Test — the 10/30/60 split** (for a 100-trace dataset):

| Bucket | Size (~) | Purpose | Usage | Critical rule |
|---|---|---|---|---|
| **Train** | ~10 | Few-shot examples in the judge prompt | Teach the judge what Pass/Fail look like | Include clear passes, clear fails, and 2–3 edge cases that teach the boundary |
| **Dev** | ~30 | Iterate and debug the judge prompt | Run the judge, review disagreements, refine the prompt | Look here freely during development without biasing final validation |
| **Test** | ~60 | Final *blind* validation of accuracy | Run only for final TPR/TNR calculation | **Never** look at test-set disagreements to refine the prompt — that's what the dev set is for |

As the dataset grows past 200 traces, shift proportions — fewer train (you rarely need more than ~10 few-shot examples), larger test set for tighter confidence intervals.

**What to label — depends on the eval type:**
- **Code-based evals** — usually no manual labels needed; the eval function determines pass/fail programmatically (a schema-validation eval doesn't need a human to confirm the JSON is valid).
- **LLM judges** — require human labels on the *specific criterion the judge evaluates*, not "overall quality" or "would I send this?" A labeler told to "rate this response" applies their own implicit criteria, which may not match the judge's. **Label the criterion, not the trace.** Trace #42 might be Pass for empathy, Fail for actionability, Pass for factual grounding — each label maps to exactly one eval criterion.

**Contamination — the failure mode that fakes success:**
- Obvious form: a test-set example ends up inside the judge prompt. When you then compute TPR/TNR on the test set, the judge is graded on something it has already seen, so accuracy looks better than it is — you ship on numbers that don't represent unseen performance.
- Subtle form: you read test-set failures and refine the judge prompt to address those specific patterns. The prompt now implicitly encodes the test distribution. You've contaminated the test set without copying anything.
- **Practical rule:** one person manages the test set; another iterates on the judge prompt using *only* the dev set. This separation prevents accidental contamination even in two-person teams.

## Dataset strategy (deep): synthetic data vs actual data

**When to use each — driven by product lifecycle:**

| | Synthetic / prototype data | Actual / production data |
|---|---|---|
| **When** | Before launch | After launch (primary source) |
| **Source** | AI PRD intents + edge cases; golden outputs from vibe checks | Real production traffic |
| **Character** | Clean, well-formatted, covers what the team already imagined | Messy, surprising, humbling — malformed queries, multi-part requests, niche industries/workflows you never designed for |
| **Target** | 20–50 traces covering happy path + known edge cases | Continuous growth; bias toward failure cases |
| **Risk** | Flattering, unrepresentative — a "fantasy version" of the product | Volume can drown signal if you sample by frequency |

**How to generate synthetic / prototype data (before launch):**
1. Pull the user intents and edge cases the AI PRD (from the PRD module) says the agent must handle — those become your first inputs.
2. Run the agent on them and collect the outputs. The input+output pairs are your traces.
3. Fold in the golden outputs from the vibe-check process — they already represent "good" for a known set of inputs.
4. You now have a 20–50 trace seed covering the happy path and the edge cases you anticipated.

**How to generate / harvest actual data (after launch) — the 5-step production pipeline:**
1. **Sample production traces** — combine random and signal-based sampling for breadth (typical traffic) and depth (where the agent struggles).
2. **Route samples to human review** — PM, designer, SME, or a dedicated labeling team. Keep the queue sustainable: **10–20 traces/week**, not 200 at once.
3. **Label with Pass/Fail, trace code, and notes** — apply the annotation rubric per criterion; record the trace-code category and annotator notes for borderline cases.
4. **Add labeled examples to the appropriate bucket** — new traces go into dev or test; the train set stays small and stable unless you're deliberately updating the judge's few-shot examples.
5. **Periodically refresh the train set** — as you discover new edge cases, swap one or two train examples for traces that better represent the current decision boundary.

**How to curate — smart sampling strategies** (the module headers these as "five strategies" but details four; use them in combination, and lean on your ML engineer's domain experience here):
- **Random sampling** — catches unknown unknowns; the baseline. Start here.
- **Failure-signal sampling** — prioritize traces flagged by existing evals, low confidence scores, user complaints, or support escalations. Most likely to expose uncovered failure modes.
- **Outlier sampling** — sort by latency, token count, or response length and review the extremes. Unusually long/short responses reveal patterns: the agent rambling when uncertain, or truncating at a context limit.
- **Stratified sampling** — group by user segment, intent type, or feature; sample proportionally but *oversample small/rare groups*. If a new enterprise segment is 3% of traffic, random sampling barely captures it; stratification guarantees you see enough to evaluate.

**Coverage & balance:**
- **Mirror the difficulty distribution of production, not the frequency distribution.** If 80% of tickets are simple billing questions, the dataset should *not* be 80% billing — the agent handles those well and you already know it.
- **Intentionally overrepresent hard cases:** edge cases, ambiguous inputs, multi-intent queries, adversarial inputs, and examples from each trace-code category.
- **Track coverage with the User Input Grid (UIG)** from the trace-analysis module. If the UIG has 12 cells and the dataset covers only 7, you know exactly which input types are missing. **A gap in coverage is a gap in the eval's ability to detect failures for that input type.**

**Refresh cadence (keeps "actual data" actual):**
- **Weekly** — review 10–20 traces plus outlier/failure signals; ~30–60 minutes; keeps you connected to what the agent actually does in production.
- **Every 2–4 weeks** — full error-analysis cycle on 100+ fresh traces: label, run evals, compare to the reference dataset; this is where new failure patterns surface.
- **After every major change** — new model, significant prompt revision, new feature, or production incident: sample and label traces from the new version *before* declaring it stable.
- **After EAP rounds** — incorporate all labeled examples immediately; EAP data is the highest-value dataset expansion you'll get.

## Visual explainers
*(11 images in the module, hosted on the Reforge/Docebo SCORM CDN; filenames below are the asset slugs.)*

- **[Visual: Dataset lifecycle]** — `ch7-01-dataset-lifecycle.jpg`. Accompanies the intro and the three-mistakes list. Shows why a dataset that's unrepresentative, mislabeled, or never refreshed makes every downstream number suspect. Teaching point: the dataset sits beneath judges and code evals — fix it first or everything above it is noise.
- **[Visual: Trace sources]** — `ch7-02-trace-sources.jpg`. The pre-launch sources (AI PRD intents, agent runs, vibe-check golden outputs) versus the post-launch source (production traffic). Teaching point: where your traces come from changes with lifecycle stage, and the synthetic→production handoff is the key event.
- **[Visual: Dataset row anatomy]** — `ch7-03-dataset-row-anatomy.jpg`. The five core fields of a row (user input, agent output, reference/ground truth, human label, notes). Teaching point: consistent row structure is what makes evals runnable programmatically and comparable across experiments.
- **[Visual: Dataset size]** — `ch7-04-dataset-size.jpg`. The 30–50 / 100+ / 200+ thresholds and what each unlocks. Teaching point: size isn't about volume — each threshold buys a specific capability (stable pass rates, reliable calibration), and quality beats quantity.
- **[Visual: Trace labels]** — `ch7-05-trace-labels.png`. A single trace (#42) carrying multiple per-criterion labels (Pass empathy / Fail actionability / Pass grounding). Teaching point: label the criterion, not the trace — a single good/bad label throws away diagnostic value.
- **[Visual: Train/Dev/Test split]** — `ch7-06-train-dev-test.jpg`. The 10/30/60 buckets with their purposes and the no-overlap rule. Teaching point: strict separation prevents the judge from "cheating" on inputs it has already seen.
- **[Visual: Production pipeline]** — `ch7-07-production-pipeline.png`. The 5-step loop: sample → route to review → label → bucket → refresh train. Teaching point: growing the dataset is an ongoing pipeline with a sustainable weekly throughput, not a one-time build.
- **[Visual: Dataset growth]** — `ch7-08-dataset-growth.jpg`. The case-study trajectory: 20 → 50 → 100 → 280 traces across four phases. Teaching point: datasets grow in deliberate phases tied to product milestones, and the input distribution visibly shifts over time.
- **[Visual: EAP comparison]** — `ch7-09-eap-comparison.png`. Standard EAP ("does it work?" → 87% on clean internal docs) vs eval-first EAP ("where does it break?" → 60% on real customer data). Teaching point: the 27-point gap was entirely in the dataset, not the model — friendly participants and clean data hide reality.
- **[Visual: Dataset versioning]** — `ch7-10-dataset-versioning.jpg`. Tracking adds/removes/relabels with timestamps so a pass-rate drop (88%→79%) can be diagnosed as regression vs harder data. Teaching point: version the dataset with the same rigor as code, or you can't interpret your own metrics.

## How this connects to: simulation
This module is the bridge between *simulated* inputs and *real* inputs. Pre-launch, the dataset is effectively a simulation: synthetic traces generated by running the agent over PRD-derived intents and edge cases — a stand-in for production you don't have yet. The module's core warning is that simulation alone produces a "fantasy version of the product," so the strategy is to treat synthetic data as scaffolding and replace/augment it with actual production traces as fast as possible (the synthetic→production transition). Where production data is thin — a 3%-of-traffic enterprise segment, a rare adversarial pattern — stratified oversampling and deliberately authored hard cases act as targeted simulation to fill UIG gaps until real examples accumulate. The eval-first EAP is the most rigorous form of this: rather than simulating customer messiness, you go capture the *actual* distribution (scanned PDFs, contradictory policies, domain jargon) under controlled observation.

## Working with ML / eng teams
- **Sampling is a collaboration point.** The module explicitly says to discuss sampling strategy with "your friendly ML engineer" — they bring domain experience on random/failure/outlier/stratified sampling and how to pull traces at scale.
- **Eng owns the plumbing** that makes sampling and versioning possible: trace logging/storage, the ability to sort by latency/token count, confidence-score capture, and the Git-or-tooling layer that timestamps dataset versions.
- **PM owns the judgment calls**: which criteria to label, the difficulty-vs-frequency balance, UIG coverage targets, refresh cadence, and the governance policies (who can add/relabel, who owns the test set).
- **Shared discipline:** the train/dev/test separation only works if responsibilities are split — one person guards the test set while another iterates on the judge prompt with the dev set. This is an operating agreement, not a tool.

## Role of design
Design appears once but meaningfully: **designers are named as valid trace reviewers/labelers** in the production pipeline ("the PM, designer, a subject matter expert, or a dedicated labeling team reviews the sampled traces"). Beyond labeling, design's natural contribution is the *acceptability* lens — what counts as a good vs needs-edits vs unacceptable output (the exact three-way rating customers apply in the eval-first EAP's week-2 structured collection). The module doesn't develop a broader design role.

## Process to follow
A PM-runnable sequence, from zero dataset to a governed, self-refreshing one:

1. **Seed (pre-launch).** Generate 20–50 traces by running the agent over AI-PRD intents/edge cases; add vibe-check golden outputs. Cover happy path + known edge cases.
2. **Structure every row** with the five fields (input, output, reference/ground truth, per-criterion label, notes).
3. **Expand toward 100** via trace analysis, deliberately authoring traces for failure modes the seed missed (ambiguous categories, multi-issue tickets, non-standard formats).
4. **Balance for difficulty.** Use the UIG to find uncovered cells; overrepresent hard cases; do not mirror frequency.
5. **Label per criterion.** Code evals: none needed. LLM judges: human labels on the exact criterion, multiple labels per trace.
6. **Split 10/30/60** into train/dev/test with no overlap. Assign one owner to the test set, another to dev-set prompt iteration.
7. **Grow from production** on the 5-step pipeline; combine random + failure-signal + outlier + stratified sampling; keep the review queue to 10–20/week. New traces go to dev/test; refresh train occasionally.
8. **Refresh on cadence:** weekly trace review, 2–4-week full error analysis, sample-before-stable after every major change, incorporate EAP data immediately.
9. **Run an eval-first EAP** at the right moment (see below) to harvest the messy real-world distribution.
10. **Version and govern.** Track every change with timestamps; document the rubric and relabel when it changes; retire (archive, don't delete) stale examples.

**Eval-first EAP — the 3-week engagement model:**
- **Week 1 — Live screen-sharing.** Watch customers use their *actual* data; note failures in real time. Ask "what did you expect to happen here?" and "how often does your data look like this?" You're capturing the real-world input distribution, not testing the feature.
- **Week 2 — Structured data collection.** Each customer submits ~20 representative queries and labels outputs (acceptable / needs edits / unacceptable); collect their actual documents with permission; document what makes their use case differ from internal assumptions.
- **Week 3 — Close the loop.** Show what you fixed and re-test on their specific edge cases, validating the fixes hold on the distribution that exposed them.
- **Selection criterion flips:** pick customers for *maximum diversity* (industries, data formats clean-vs-scanned, communication styles, workflow complexity) — not friendliness.
- **Deliverable:** 100+ new labeled examples, 15–20 new edge cases, documented failure modes. "Five customers said they liked it" is not signal; "we found 12 failure patterns in messy PDFs and added 40 labeled examples covering them" is.

## References & sources
- **Course:** Reforge module, "Managing Eval Datasets" (delivered via Docebo / SCORM). Four lessons: (1) Intro, (2) Growing Your Dataset from Production, (3) Dataset Versioning and Governance, (4) Recap and Further Learning. SCORM player: `https://cdn5.dcbstatic.com/files/r/e/reforge_docebosaas_com/.../scormcontent/index.html`
- **Cross-references to other modules in the same course:**
  - AI PRD module (source of initial intents/edge cases) — referenced as "module 3."
  - Vibe-check / golden-outputs module — "module 2."
  - Trace analysis, trace codes, and the **User Input Grid (UIG)** — "module 4."
  - Code evals incl. the **hallucination guard** — "module 6."
  - LLM judges & confusion-matrix calibration (TPR/TNR), the next module — "module 9."
- **Running case study:** the **Support Triage Agent** (categories: Technical, Billing, Feature Request; criteria: empathetic acknowledgement, actionability, factual grounding) — used across the whole course, here to illustrate the 20→50→100→280-trace growth path.
- **Real-world case:** an IT Service team at an (unnamed) public SaaS company — 87% internal pass rate vs 60% real-world, the gap entirely in the dataset.
- **Tools named:** **Git** or a dataset-management tool for versioning; generic "dataset management tool with timestamps."
- **Key terms/frameworks defined:** Eval dataset; Trace; Train/Dev/Test split (10/30/60); Dataset contamination; Dataset versioning; Eval-first EAP; smart sampling (random / failure-signal / outlier / stratified); User Input Grid; difficulty-vs-frequency distribution; label-the-criterion-not-the-trace; golden outputs.
- **Roles referenced:** PM, designer, subject matter expert (SME), dedicated labeling team, support team lead, ML engineer.

## Skill / template / app ideas
- **`/dataset-row`** — scaffold a reference-dataset row with the five mandatory fields and a slot per labeling criterion.
- **`/trace-sampler`** — pull a production sample combining random + failure-signal + outlier + stratified strategies, with knobs for per-segment oversampling.
- **`/uig-coverage`** — diff the current dataset against the User Input Grid and report uncovered cells as a prioritized gap list.
- **`/split-dataset`** — take a labeled dataset and emit a no-overlap 10/30/60 (or size-scaled) train/dev/test split, with a contamination-check report.
- **`/contamination-lint`** — scan a judge prompt's few-shot examples against the test set and flag any leak.
- **`/dataset-refresh`** — scheduled weekly/biweekly digest that surfaces outliers + failure-signal traces and queues 10–20 for review.
- **Eval-first EAP kit** — a 3-week playbook template: week-1 screen-share script, week-2 query-submission + acceptable/needs-edits/unacceptable labeling sheet, week-3 fix-and-retest tracker; deliverable scorecard (labeled examples, new edge cases, failure modes).
- **Dataset version log** — a Git-backed changelog template recording add/remove/relabel + reason + timestamp + dataset version, linked to eval-run results.
- **Governance one-pager** — fill-in-the-blank policy: who adds rows, who relabels, who owns the test set, rubric-change → relabel protocol, archive (not delete) rule.

## Teaching notes (for the instructor)
**Lead with the thesis and never let go:** "Your evals are only as good as the data you run them on." Every section is a corollary of that one line.

**The three highest-leverage ideas to drill:**
1. **Mirror difficulty, not frequency.** This is the most counterintuitive move for PMs trained on representative sampling. Use the 80%-billing example and the "501st billing ticket vs first handwritten PDF" line — they land.
2. **Label the criterion, not the trace.** Show trace #42 with three different per-criterion verdicts. The failure mode to call out: a labeler told to "rate this response" invents their own implicit rubric.
3. **Contamination is subtle.** The non-obvious case (reading test failures → tweaking the prompt) is the one that catches good teams. Anchor it with the "one person owns the test set" rule.

**Common misconceptions to correct:**
- "Bigger dataset = better." No — 50 diverse well-labeled beats 500 easy-case duplicates.
- "We'll just sample production randomly." Random is only the baseline for unknown-unknowns; without failure/outlier/stratified sampling you miss the cases that matter.
- "EAP = does it work?" Reframe: eval-first EAP = where does it break? The deliverable is a dataset, not a testimonial.
- "Small team, skip governance." Use the six-months-later relabeled-15-test-traces horror story.

**Note an internal inconsistency to flag honestly:** the module's narration says "five sampling strategies" but enumerates only four (random, failure-signal, outlier, stratified). Teach the four; if pressed, a natural fifth is *intent/trace-code-targeted sampling* to fill UIG gaps, but that isn't named in the source — don't present it as canonical.

**Discussion / exercise:** Take a live AI feature. (a) Sketch its User Input Grid and mark which cells your current dataset covers. (b) Estimate your real difficulty distribution vs your dataset's — are you over-indexed on the happy path? (c) Design a 3-week eval-first EAP for it: who would you pick for diversity, and what's your target labeled-example count? (d) Write your one-line governance answers: who owns the test set, who can relabel.
