# Systems Thinking & Mental Models for Eval-Driven PMs

This synthesis pulls the mental models scattered across all fourteen chapters into one operating system. Teach the shift first; teach the models as the tools that make the shift operational; then show how they compose.

## The shift: from deterministic to probabilistic product thinking

Every model in this course descends from one reframe. In deterministic software, "done" is binary, behavior is repeatable, and a usage funnel describes success. In AI-native products built on frontier models:

- **The same input can produce different outputs** — the system does not behave the same way 100% of the time (Ch 1, 2).
- **Each interaction lands somewhere on a wide distribution** of personalized outcomes — good, bad, and a large grey "unknown" zone (Ch 1).
- **The core capability is usually free at launch; the reliability is the work.** Five of Claude Code's first seven releases were performance improvements to a capability it already shipped with (Ch 3).
- **Failures are emergent, not enumerable**, and the underlying model can be swapped out from under you every few months (Ch 2).

So the PM's job changes from *getting a user to the end of a flow* to *guaranteeing the quality of the work performed at the end of that flow* — which means owning the definition of "good," the rubric that scores it, and the roadmap that raises the score (Ch 1, 3). Accept up front that a significant share of sessions will have an *unknown* outcome; uncertainty is the new reality, not a measurement failure (Ch 1).

## The core mental models

Each is defined crisply with the chapter it comes from. Together they are the toolkit.

### Foundational frame

**The AI Flywheel** *(Ch 1)* — a closed, compounding loop for improving AI quality: Agent Success Rate → Trace Analysis → Reference Datasets → Offline Evaluation → Online User Monitoring → back to Agent Success Rate. Quality is *engineered* through this loop, not hoped for at launch. The defining property is that it is a *loop, not a line* — monitoring feeds the dataset, which sharpens the evals, which guide the next experiment.

**The two-layer eval stack** *(Ch 1)* — model-layer benchmarks (provider-owned, standardized, slow-moving — what an LLM can do in isolation) sit *beneath* application-layer evals (product-owned, fast-moving, domain-specific — whether outputs meet user expectations in real contexts). No external benchmark (METR, GDP-Val, Terminal-Bench) defines quality for *your* domain. **PMs operate at the application layer.**

**Funnel vs. distribution** *(Ch 1)* — stop picturing your product as a Sankey funnel (one path, one endpoint) and start picturing it as a probability distribution of outcomes. You're not pushing everyone through one door; you're *shifting the whole distribution toward higher quality and shrinking the bad tail*. A single completion event cannot describe a distribution.

### Sequencing models (when to do what)

**The eval lifecycle: Manual → Automated → Live** *(Ch 2)* — three stages matched to three product phases: Vibe Checks (prototype) → Offline Evals (build) → User Monitoring (optimize). Rigor and automation increase left to right; the arrow also loops back (production failures become permanent regression tests).

**Known unknowns vs. unknown unknowns** *(Ch 2, 11)* — offline evals only test what you already know to look for; online monitoring is the *only* stage that reveals what you didn't anticipate. You need both. Captured later as **pre-flight checklist vs. cockpit instruments** *(Ch 11)*: the checklist gets you off the ground; the instruments keep you from flying into a mountain you didn't know was there.

**Demo before Memo** *(Ch 2, 3)* — you prototype and vibe-check *before* writing the spec; the demo informs the memo, not the other way around. You can't produce credible golden outputs (and therefore can't write a credible PRD) without first feeling the product by hand. The most counter-intuitive, most PM-identity-challenging idea in the course.

**Observe before you score** *(Ch 4)* — treat traces like a UX researcher treats session recordings: raw evidence reviewed before you have an opinion to confirm. The pipeline runs one direction — *raw traces → free-form notes → binary trace codes → rubrics, datasets, automation* — and skipping to the right end is the cardinal sin. You earn the right to automate only after the raw behavior taught you what the categories should be.

**Cheap-lever-first ordering** *(Ch 5, 10)* — **prompt → architecture → eval** as a triage order (Ch 5), and **prompt → model → architecture** as an improvement order (Ch 10), both sorted by cost. Always exhaust the cheap fix before the expensive one. The recurring, costly mistake is reaching for a model swap or re-architecture before exhausting prompt fixes.

### Diagnostic models (which problem is this)

**The three gaps** *(Ch 5, repeated Ch 10)* — the master diagnostic that routes every failure to an owner:
- **Specification gap** — the instructions were *incomplete* for the scenario. → Fix the prompt (PM/prompt work). Not an eval problem.
- **Architectural/system gap** — it *never* works even with a clear prompt (missing integration, wrong tool, model limit). → Engineering fix. No measurement helps disconnected plumbing.
- **Generalization gap** — it works *sometimes* but not reliably despite clear instructions. → **The only failure mode that earns an automated eval**, because the system already *can* do it; you need to make the inconsistency visible and improvable.

**Measurable → improvable** *(Ch 5)* — the point of automating is leverage: once a behavior has a number on it, you can swap models, tune prompts, or change architecture and instantly know if you helped or hurt. An eval is a permanent, reusable instrument — so you only build them for things worth instrumenting permanently.

**Mechanical vs. conceptual** *(Ch 6)* — sort every candidate eval into one bin first. Mechanical (tool-call failure, schema, latency, exact string) → code, by default. Conceptual (intent, tone, quality) → LLM judge, only after confirming it's genuinely conceptual. The **10-line rule of thumb**: if you can express the success condition as a Python function in under ten lines, it belongs in code.

**Floor, not ceiling** *(Ch 6)* — code evals are the bedrock that verifies the specific objectively-checkable properties you chose. A green code-eval suite is *not* the same as a good agent; judges and human review layer on top for the helpful/coherent/empathetic properties code can't reach.

**The judge as auditor, not assistant** *(Ch 7)* — the original model *produces*; the judge *inspects against one standard*. The common mistake is treating it as a generic quality rater ("rate this 1–10") instead of a specialist inspector ("does this open by acknowledging the customer's specific frustration — yes or no?"). Two strict rules: **binary, not Likert** (forces clarity, easy to validate, hard to game; annotators default to the middle to dodge hard calls) and **narrow scope** (one trace category per judge; improves accuracy ~10–15% and enables per-dimension root-cause analysis).

**What you feed in determines what you can measure** *(Ch 7)* — a dial, not a default. Output only → tone/format/directness. Output + query → relevance/responsiveness. Output + reference doc → factual accuracy/grounding. This is the **reference-free vs. reference-based** build-order: start reference-free (any traces will do) and use those judges to *build* your dataset; add reference-based judges once you have reliable ground truth.

**The judge is an opinion, not a fact** *(Ch 9)* — a pass rate only tells you what the judge thinks; **calibration tells you whether the judge thinks the same way your domain experts do.** Decompose one pass rate into two asymmetric reliability numbers — **TPR** (of outputs humans passed, did the judge pass them? catches *good*) and **TNR** (of outputs humans failed, did the judge fail them? catches *bad*). They fail in opposite ways and need opposite fixes. **TNR is the harder number** because LLMs are trained to be agreeable. The risk lesson: **an uncalibrated judge is worse than no judge** — it makes you *believe* you've automated quality.

### Improvement & operation models

**Evals measure; experiments improve** *(Ch 10)* — the foundational principle of iteration. An eval suite never raises quality on its own; it adjudicates whether an experiment moved the number. Quality is produced by the *experiments you run against the instrument*. Corollary: **one change at a time** (two changes that add 8 points teach you nothing about which helped), **same reference dataset always**, **per-eval deltas not aggregate**, and **ship / iterate / revert** on evidence ("no measurable improvement is not an improvement").

**Two layers moving in lockstep** *(Ch 10)* — every iteration cycle improves *both* the agent (prompt/model/architecture) *and* the measuring instrument (PRD thresholds, dataset, judges): failing traces become new test cases, resolved traces become regression tests. The map (aggregate pass rate) tells you *where* the problem is; "going to the ground" (reading ~10 failing traces and their reasoning strings) tells you *why*.

**Production is a data generator, not a delivery channel** *(Ch 11)* — every live interaction is a potential test case; surprises are raw material, not noise. The PM's job is to *build the pipe that turns surprise into dataset*. Paired with: **a number without a response procedure is just noise** — every alert needs a named owner, a first check, and an escalation rule, decided while calm (before launch), or the team learns to ignore alerts.

**The three drift signals** *(Ch 11)* — drift isn't one phenomenon; diagnose which of three you're seeing because each has a *different* fix: (1) *score divergence* (offline ≫ online) → refresh/rebalance the dataset; (2) *new failure modes* → fresh trace analysis, new trace codes, new evals; (3) *user-feedback contradiction* (evals green but tickets rising) → you're measuring the wrong thing; build new judges for the missing dimension. Signal 3 is the most insidious.

### Complex-agent models

**The system score is the product of its parts** *(Ch 12)* — a complex agent is a chain (or tree) of components, each with its own quality rate. 0.95 × 0.95 × 0.76 × 0.95 multiplies down to the low 60s — it doesn't *average* to "pretty good." The black-box success rate hides the multiplication; **architectural decomposition** (routing / individual skills / full-path) exposes which knob to turn. "The agent fails 45% of the time" is not a roadmap; "routing 8%, SQL 24%, summarization 6%" is.

**Fix upstream first / work backwards** *(Ch 12, 13)* — in a sequential pipeline, a 3% Step-1 failure isn't a 3% problem: every downstream step then runs *correctly on wrong inputs* and silently inherits the error. The instinct to "fix where the error appears" is the trap; the discipline is to find the *last correct step*, inspect the next one, and count **primary** failures only (10 Step-1 failures rippling through Steps 3–7 is 10 failures, not 50). The highest-leverage eval usually sits at the *top* of the pipeline.

**Failure funnel: the weakest link, not the mean** *(Ch 13)* — picture a marketing funnel where *traces* flow through and each stage is a step the agent must get right. **Step-level pass rate** (of traces that *reached* this step) measures intrinsic quality and drives engineering prioritization; **cumulative pass rate** (of all original traces) is the user-facing reality and drives stakeholder communication. Two traps it breaks: the *averaging trap* (a chain's strength is its weakest link, not the mean) and the *"high pass rate = healthy" trap* (late steps look great only because they never see traces that died upstream). Leverage is arithmetic: improving an early bottleneck (76%→95%) recovers many traces; improving a healthy late step (96%→99%) recovers a handful.

### Tooling model

**The trace app as a disposable jig** *(Ch 14)* — a custom trace-review tool is a cheap, self-built fixture that makes one repeated task fast and consistent, not a product. Three implications: it's built around *your* workflow not the vendor's; **friction is the spec** (run a real session, let the slow/confusing moments become the backlog); and cheap-to-build means cheap-to-change. The deeper shift: the bottleneck was never "we don't have a trace viewer" — it was "the viewer we have doesn't fit our work," and AI coding tools make fit cheap. Because review speed sets eval-flywheel speed, the jig is leverage.

### A cross-cutting habit

**Playing offense, not just defense** *(Ch 4, 5)* — trace analysis and evals aren't only error-hunting. Capture *affirmative* patterns (immediate-accept outputs, next-question anticipation, uniquely useful formats) to reinforce what's great (Ch 4); and use explicit per-stage thresholds (alpha/beta/GA) to *ship risky frontier features deliberately* — a 55%-success feature can be a power-user opt-in (Ch 5). Evals are a growth/competitive lever, not just a quality gate.

## How these compose into one operating system

The models are not a grab-bag; they nest. Read them as one continuous loop:

1. **Reframe** with funnel→distribution and measure-work-not-usage (Ch 1). This tells you *what kind of thing you're managing*: a distribution of outcomes, owned at the application layer.
2. **Sequence** with demo-before-memo and observe-before-you-score (Ch 2–4). You prototype, feel the product, read traces free-form, and only then formalize. This produces binary trace codes — the atomic unit everything downstream is built from.
3. **Diagnose** with the three gaps and mechanical-vs-conceptual (Ch 5–6). Each trace code is routed: prompt-fix, eng-fix, or eval — and each eval is routed: code or judge.
4. **Instrument** with floor-not-ceiling, judge-as-auditor, and judge-is-an-opinion (Ch 6–9). Code evals form the floor; narrow binary judges add the subjective ceiling; calibration (TPR/TNR) makes the judges trustworthy. The dataset (mirror-difficulty-not-frequency) is the lens all of this looks through.
5. **Improve** with evals-measure-experiments-improve and two-layers-in-lockstep (Ch 10). Controlled, one-change experiments turn measurement into product gain *and* sharpen the instrument.
6. **Close the loop** with production-is-a-data-generator and the three drift signals (Ch 11). Surprises feed the dataset; the flywheel compounds.
7. **Scale** with system-score-is-the-product-of-parts, fix-upstream-first, and the failure funnel (Ch 12–13) when the agent is multi-step.
8. **Accelerate** the human bottleneck with the trace-app-as-a-jig (Ch 14), because review speed gates the speed of all of the above.

The single sentence that holds it together: **you are running a controlled, compounding experiment on a probability distribution — define "good," observe reality, isolate the variable, measure the move, feed the surprise back, and never let the instrument drift out of sync with the world it's supposed to measure.**
