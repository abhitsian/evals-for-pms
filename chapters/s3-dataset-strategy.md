# Dataset Strategy: Synthetic Data & Actual Data

The dataset is the single most underinvested part of most eval systems and the foundation everything else inherits (Ch 8). Every judge, every calibration, every "we improved 5 points" claim is only as trustworthy as the data underneath it. This synthesis is the complete dataset playbook — drawn mostly from Chapter 8, with the User Input Grid from Chapter 4, production feedback from Chapter 11, and the seeding sequence from Chapters 2–3.

## The one-line thesis and the three fatal mistakes

**"Your evals are only as good as the data you run them on."** (Ch 8) A dataset that doesn't reflect production produces metrics that look good and mean nothing — the most dangerous kind of number, because it survives a product review and gates a launch while being wrong.

The three dataset mistakes that destroy eval validity (Ch 8):
1. **Unrepresentative data** — doesn't match the distribution of inputs the agent handles *poorly* in production → every number is suspect.
2. **Incorrectly labeled data** — your LLM judge is calibrated against noise, not signal (Ch 9).
3. **Never refreshed** — your evals gradually measure a version of the product that no longer exists.

## Anatomy of a dataset row (Ch 8)

Every row carries the same core fields so evals run programmatically and results compare across experiments:
- **User input** — the original query/ticket/request.
- **Agent output** — the full response: structured fields, tool calls, intermediate reasoning.
- **Reference / ground truth (if available)** — retrieved context or golden output for reference-based judges; input data for code evals that check against input (e.g. a hallucination guard).
- **Human label (Pass/Fail)** — **one label per criterion/trace code.** Trace #42 can be Pass-empathy, Fail-actionability, Pass-grounding. **Label the criterion, not the trace** — a single "good/bad" label throws away diagnostic value (Ch 8).
- **Notes** — free text for borderline cases, labeler reasoning, future-reviewer context.

## Synthetic data: when, how, coverage, risks

**When.** Before launch, when you have no production traffic yet (Ch 8). Also as a *patch* for known failure modes the moment you discover them (Ch 3: the team authored 5 sarcastic-complaint examples when the prototype struggled with sarcasm, as a bridge until real labeled sarcastic tickets accumulated).

**How to generate the pre-launch seed (Ch 8, 4-step):**
1. Pull the user intents and edge cases the **AI PRD** (Ch 3) says the agent must handle — those become your first inputs.
2. Run the agent on them; collect outputs. Input+output pairs are your traces.
3. Fold in the **golden outputs** from the vibe-check process (Ch 2) — they already represent "good" for a known set of inputs.
4. You now have a 20–50-trace seed covering the happy path + anticipated edge cases.

**Coverage — the User Input Grid (UIG) is the method (Ch 4).** Don't "just ask an LLM for test queries" — that produces generic inputs that miss edge cases. *Engineer* diversity: define 3–5 dimensions (ICP × persona × intent × context richness × ambiguity) → 2–3 grounded examples each → combine into a grid → prune implausible cells → add real-world constraints (missing context, ambiguous terms, time sensitivity, conflicting requirements, business rules) → have an LLM write 2–3 natural-language query variations per cell, preserving realistic ambiguity. Track dataset coverage *against* the UIG: if the UIG has 12 cells and the dataset covers 7, you know exactly which input types are missing — and **a gap in coverage is a gap in the eval's ability to detect failures for that input type** (Ch 8).

**Risks of synthetic data:**
- **Flattering and unrepresentative** — "a fantasy version of the product" (Ch 8). Clean, well-formatted, covers only what the team already imagined.
- It must be treated as **scaffolding**, replaced/augmented with real traces as fast as possible (Ch 8 synthetic→production transition).
- Stress-testing realism is the goal, not realism for its own sake (Ch 4) — but don't mistake stress-test coverage for production representativeness.

## Actual / production data: sampling, transition, refresh, contamination, splits, governance

**The synthetic→production transition is the single most important dataset event** (Ch 8). Pre-launch you only have a clean internal dataset; production data is messy, surprising, and humbling (malformed queries, multi-part requests, niche workflows you never designed for). Teams that never make this transition run evals against a fantasy. **Plan for the transition from day one.**

### Sampling strategies (Ch 8, reinforced Ch 11)

The module lists four (narration says "five" but enumerates four — teach the four). Use in combination; lean on your ML engineer's domain experience.

| Strategy | What it catches | When |
|---|---|---|
| **Random** | Unknown unknowns; the unbiased baseline / ground truth for overall quality | Always — start here |
| **Failure-signal** | Uncovered failure modes — traces flagged by existing evals, low confidence, complaints, escalations | Highest-ROI for finding problems fast |
| **Outlier** | Patterns at the extremes — sort by latency/token count/length; rambling-when-uncertain or context-limit truncation | Periodic deep dives |
| **Stratified** | Coverage of small/rare groups — group by segment/intent/feature, sample proportionally but *oversample rare groups* (a 3%-of-traffic enterprise segment is barely seen by random sampling) | When segments matter |

**Combination approach (Ch 11):** random sample for aggregate metrics + failure-biased sample for debugging. Random tells you the overall level; failure-biased tells you what's going wrong and where.

### The production harvesting pipeline (Ch 8, 5-step)

1. **Sample** production traces (random + signal-based).
2. **Route to human review** (PM, designer, SME, or labeling team). Keep the queue sustainable: **10–20 traces/week**, not 200 at once.
3. **Label** with Pass/Fail per criterion + trace code + notes.
4. **Add to the appropriate bucket** — new traces go to dev or test; train stays small and stable.
5. **Periodically refresh the train set** — swap one or two train examples for traces that better represent the current decision boundary.

Chapter 11 makes this concrete: production experience generates labeled data → better evals → better improvements → better experience. **"One support ticket is an anecdote; five about the same pattern is a trace code."** Users consistently editing a specific output type → those edits *are* golden examples ("the user is showing you what good looks like"). A monitoring-flagged regression → label the failing traces → it becomes a permanent regression test. The case-study team kept adding ~10 production traces/week to build a new API-specific dataset slice.

### Coverage & balance — mirror difficulty, not frequency (Ch 8)

The most counter-intuitive move for PMs trained on representative sampling. Production is mostly easy traffic the agent already handles. If 80% of tickets are simple billing questions, the dataset should *not* be 80% billing — you already pass those. **The marginal value of your 501st routine billing ticket is near zero; the marginal value of your first scanned PDF with handwriting is high.** Intentionally overrepresent edge cases, ambiguous inputs, multi-intent queries, adversarial inputs, and examples from each trace-code category.

### Dataset size minimums and what each unlocks (Ch 8)

| Size | Unlocks |
|---|---|
| **30–50** | Minimum seed from vibe checks + trace analysis; happy path + known failure modes |
| **100+** | Meaningful, stable offline pass rates (below 50, one trace flipping swings the rate 2+ points) |
| **200+** | Reliable judge calibration — enough to split train/dev/test *and* compute valid TPR/TNR per bucket |

**Quality over quantity:** 50 diverse, well-labeled examples beat 500 that oversample easy cases.

### Train / Dev / Test split — the 10/30/60 (Ch 8, calibration discipline Ch 9)

| Bucket | Size (~, for 100) | Purpose | Critical rule |
|---|---|---|---|
| **Train** | ~10 | Few-shot examples in the judge prompt | Include clear passes, clear fails, 2–3 boundary-teaching edge cases |
| **Dev** | ~30 | Iterate & debug the judge prompt | Look here freely during development |
| **Test** | ~60 | Final *blind* validation (TPR/TNR) | **Never** look at test disagreements to refine the prompt |

As the dataset grows past 200, shift proportions — fewer train (rarely need >10 few-shot examples), larger test for tighter confidence intervals. Chapter 9 applies the same split to calibrating the *judge itself*: iterate on dev, validate once on test, and if test metrics are >5 points below dev you've overfit.

### Contamination — the failure mode that fakes success (Ch 8)

- **Obvious form:** a test-set example ends up inside the judge prompt → the judge is graded on something it has seen → accuracy looks better than it is.
- **Subtle form:** you read test-set failures and tune the prompt to address them → the prompt now implicitly encodes the test distribution. You contaminated the test set without copying anything.
- **Practical rule:** one person manages the test set; another iterates on the judge prompt using *only* the dev set. Treat a leaked test set the way you'd treat a leaked benchmark (Ch 9).

### What to label, by eval type (Ch 8)

- **Code-based evals** — usually *no* manual labels needed; the function determines pass/fail programmatically.
- **LLM judges** — require human labels on the *specific criterion the judge evaluates*, not "overall quality." A labeler told to "rate this response" applies their own implicit rubric.

### Refresh cadence (keeps "actual data" actual) (Ch 8)

- **Weekly** — review 10–20 traces + outlier/failure signals (~30–60 min).
- **Every 2–4 weeks** — full error-analysis cycle on 100+ fresh traces.
- **After every major change** — new model, big prompt revision, new feature, or incident: sample and label from the new version *before* declaring it stable.
- **After EAP rounds** — incorporate all labeled examples immediately (highest-value expansion).

### Governance & versioning (Ch 8)

Version the dataset with the same rigor as code: track every add/remove/relabel with timestamps and reason, so a pass-rate drop (88%→79%) can be diagnosed as a *regression* vs. *harder data*. Document the rubric and relabel when it changes. **Archive, don't delete**, stale examples. Write the one-line governance answers: who adds rows, who relabels, who owns the test set. (Tools named: Git or a dataset-management tool with timestamps.)

### The eval-first EAP — production data, captured deliberately (Ch 8)

The most rigorous form of the synthetic→production transition: an Early Access Program structured for *edge-case discovery and dataset building*, not feature validation. Its deliverable is labeled examples and documented failure modes, not testimonials.

- **Week 1 — Live screen-sharing.** Watch customers use their *actual* data; ask "what did you expect here?" and "how often does your data look like this?" Capturing the real input distribution, not testing the feature.
- **Week 2 — Structured collection.** Each customer submits ~20 representative queries and labels outputs (acceptable / needs edits / unacceptable); collect their actual documents with permission.
- **Week 3 — Close the loop.** Show what you fixed; re-test on their specific edge cases.
- **Selection criterion flips:** pick for *maximum diversity* (industries, clean vs. scanned data, communication styles, workflow complexity), not friendliness.
- **The proof point:** standard EAP "does it work?" → 87% on clean internal docs; eval-first EAP "where does it break?" → 60% on real customer data. **The 27-point gap was entirely in the dataset, not the model.**

## Decision table: synthetic vs. actual by product stage

| Product stage | Primary data source | What you're doing | Key risk to watch | Source |
|---|---|---|---|---|
| **Prototype (pre-PRD)** | Synthetic (vibe-check inputs, golden outputs) | Seed 20–50 traces; build intuition; surface first trace codes | Coverage gaps; over-clean | Ch 2, 4, 8 |
| **Build (pre-launch)** | Synthetic + UIG-engineered | Grow toward 100; balance for difficulty; author hard cases for known failure modes; split 10/30/60 | "Fantasy version" — unrepresentative of real messiness | Ch 3, 4, 8 |
| **Early access (EAP)** | Actual, captured deliberately | Eval-first EAP: harvest the real messy distribution; 100+ labeled examples, 15–20 new edge cases | Picking friendly (not diverse) customers | Ch 8 |
| **Launched / GA** | Actual (production traffic, primary) | 5-step harvesting pipeline; combine 4 sampling strategies; refresh on cadence; convert tickets/edits/escalations into rows | Volume drowning signal if you sample by frequency; staleness | Ch 8, 11 |
| **Calibrating a judge** | Actual, hard/borderline-weighted | Pull 50–100 representative traces incl. borderline; split dev/test; near-miss examples from real false positives | Contamination; cherry-picking only-obvious traces | Ch 9 |
| **Mature / drifting** | Actual, drift-driven | On score divergence → rebalance to real distribution; on new failure modes → new trace codes/slices; on feedback contradiction → new criteria | Measuring the wrong thing (drift Signal 3) | Ch 11 |

## The closing rule

Treat the dataset as a **lens** you keep grinding until it faithfully shows production reality — *especially the hard parts of it* — and never let the lens get contaminated by the thing it's supposed to measure (Ch 8). Synthetic data is scaffolding to get started; actual data is the renewable fuel that keeps the whole flywheel honest. The PM owns the judgment calls (which criteria to label, the difficulty-vs-frequency balance, UIG coverage targets, refresh cadence, governance); eng owns the plumbing (trace logging, sorting by latency/tokens, confidence capture, the versioning layer).
