# Chapter 11 — User Monitoring

## In one line
Offline evals test what you *know* to look for; online monitoring reveals what you *didn't anticipate* — so once an agent is live, you run your evals against a sample of real production traffic, watch for the moment offline and online scores diverge, and feed every production surprise back into the dataset to spin the flywheel.

## Why it matters for PMs
- The diversity of real user inputs will *always* exceed your reference dataset. A team that only runs offline evals is "flying with a pre-flight checklist but no cockpit instruments." Shipping is not the finish line — it's the moment your test set starts going stale.
- The most dangerous failure is invisible: your dashboard shows a 92% pass rate while support tickets pile up. Without online monitoring, a regression stays hidden until *enough users complain to trigger a manual investigation* — which is slow, embarrassing, and erodes trust.
- This is a PM-owned decision surface, not just an eng one. What to sample, how much to sample, what to alert on, and what threshold counts as "a problem" are product-quality calls. Set them when you're thinking clearly about quality standards, not while reacting to a number you just saw.
- It's the engine of the AI Product Flywheel introduced at the start of the course. Online monitoring is *how you spin it* — production experience generates labeled data, which enables better evals, which drive better improvements, which produce a better production experience.
- The case study makes the stakes concrete: ideal time from drift detection to fix should be **under 10 days**. That cadence is only possible if monitoring is in place from week zero.

## Core concepts
- **Offline evals** answer: *"Does this version meet our quality bar before we ship it?"* — run against a curated reference dataset, pre-launch, as a gate.
- **Online evals (online evaluation)** answer: *"Is the product meeting our quality bar right now, with real users?"* — automated evaluators (code-based + LLM judges) run against a **sample of live production traces**, aggregated into dashboards that track quality over time. You don't evaluate everything; you sample 1–10% by volume and cost. Both questions matter; they measure different things.
- **The same evals carry over.** The code evals from earlier modules (category label, schema validation, hallucination guard) and the LLM judges (empathy, actionability, factual grounding) should produce *comparable* scores in production. If they don't, that gap is itself a signal.
- **Production-specific signals** that don't exist offline: latency distributions under real load, error rates, timeouts, token usage, cost-per-interaction. A response that scores perfectly on every eval but takes 40 seconds to arrive still frustrates a user who expected 4 seconds. Operational metrics shape experience even when quality is high.
- **User-level signals**: thumbs up/down, user edits to outputs before accepting, retry rates (same question asked again ≈ first answer was unsatisfactory), session length/abandonment, support ticket volume correlated with agent interactions. None is reliable alone; together they form a composite picture.
- **Eval drift**: the divergence between offline scores and real-world quality, caused by dataset staleness, new user segments, or misaligned eval criteria.
- **Composite North Star**: a single quality metric blending multiple feedback channels (thumbs, tickets, edits, session behavior) to approximate true satisfaction more reliably than any one signal.
- **Failure-biased sampling**: prioritize traces likely to contain problems (flagged by code evals, low confidence, user complaints) for expensive LLM-judge evaluation — the highest-ROI use of inference budget.

## The mental model — how to think about this
Think **pre-flight checklist vs. cockpit instruments.** Offline evals are the checklist you run before takeoff — they verify everything you knew to check. Online monitoring is the live instrument panel that tells you what's actually happening in the air, including conditions you never planned for. You need both. The checklist gets you off the ground; the instruments keep you from flying into a mountain you didn't know was there.

The second mental shift: **production is a data generator, not just a delivery channel.** Every live interaction is a potential new test case. Surprises aren't noise to be filtered out — they're the raw material that keeps your eval suite honest. The PM's job is to build the pipe that turns surprise into dataset.

The third: **a number without a response procedure is just noise.** Monitoring is only useful if every alert has a named owner, a first thing to check, and an escalation rule. Otherwise you train your team to ignore alerts.

## Key frameworks / steps / loops

**1. Sampling strategies (how to sample)**
- *Random sampling* — unbiased baseline; your ground truth for "how is the product doing overall." Pass rates on a random sample represent the full traffic distribution.
- *Stratified sampling* — by user segment, intent type, or product feature, to guarantee coverage of minorities. If 3% of traffic is enterprise, a flat 5% random sample barely captures them; stratify to see enough of each segment to compute meaningful pass rates.
- *Failure-biased sampling* — use eval scores, confidence signals, or user feedback to surface problems faster. Code eval flags a trace failing → always run the judges on it. User gave a thumbs-down → that trace enters the eval queue.
- *Combination approach* — random sample for aggregate metrics + failure-biased sample for debugging. Random tells you the overall level; failure-biased tells you what's going wrong and where.

**2. How much to sample**
- **Code evals: 100% of traffic.** Deterministic, fast, negligible compute. No reason to sample unless volume makes even microsecond-per-trace checks infeasible.
- **LLM judges: 1–5% for high-traffic products; up to 10% for lower-traffic or high-stakes domains.** Sample high enough that a weekly sample yields **at least 50–100 evaluated traces** — below that you can't compute reliable pass rates or detect trends.
- **Always** run judges on traces flagged by code-eval failures or user complaints. Highest-ROI use of judge budget.

**3. The three drift signals**
- *Signal 1 — Score divergence*: offline 90%, online 72% on the same evals → reference dataset doesn't represent production. **Fix:** add production traces to the dataset; rebalance to actual input distribution (dataset refresh).
- *Signal 2 — New failure modes*: online traces show error patterns absent from the reference data → coverage gap. **Fix:** run a fresh trace-analysis cycle, create new trace codes, build new evals. Flywheel in action.
- *Signal 3 — User feedback contradiction*: eval scores high but thumbs-down / tickets / churn rising → *you're measuring the wrong thing* (the most insidious signal). Often reveals subjective dimensions — clarity, brevity, specificity — the team assumed were covered. **Fix:** go back to failure analysis, update eval criteria, build new LLM judges for the missing dimensions.

**4. The feedback-to-dataset flywheel**
- One support ticket = an anecdote. **Five tickets about the same pattern = a trace code.**
- Users consistently editing a specific output type → those edits *are* golden examples ("the user is showing you what good looks like").
- A monitoring-flagged regression → pull the failing traces, label them, add to the dataset → **the regression becomes a regression test.**
- Production experience generates labeled data → better evals → better improvements → better experience. Loop closed.

**5. Alerting & thresholds**
- Code eval pass rate drops below threshold (e.g. category accuracy < 85%).
- LLM judge pass rate drops >10 points from the trailing average.
- Latency P95 exceeds SLA (e.g. > 2s).
- User complaint rate spikes to ~3× baseline (thumbs-down, tickets, retries).
- Refusal / "I don't know" rate goes above 30% (too conservative) or below 5% (overconfident — likely generating unreliable outputs; ties to the confidence framework).
- *Hygiene:* set thresholds **before launch**; use **7-day rolling averages** to kill daily-noise false alarms; give **every alert a documented response procedure** (who investigates, what they check first, when it escalates).

## Visual explainers

**[Visual: The offline–online gap]** (`ch10-01-offline-online-gap.jpg`) — Depicts the widening gap between a healthy offline pass rate and degrading real-world experience over time. Teaching point: offline scores can keep climbing while production quality falls; the gap is the thing to instrument, because it grows silently unless you actively measure it.

**[Visual: Monitoring architecture]** (`ch10-02-monitoring-archite.png`) — Shows the production pipeline: live traces → sampling layer → code evals on 100% + LLM judges on 1–10% → aggregated dashboards/metrics. Teaching point: monitoring isn't one switch; it's an architecture where cheap deterministic checks run on everything and expensive judges run on a deliberate sample plus all flagged traces.

**[Visual: Sampling strategies]** (`ch10-03-sampling-strategie.jpg`) — Compares random, stratified, and failure-biased sampling side by side. Teaching point: each strategy answers a different question (overall quality / per-segment coverage / fast problem discovery); mature teams combine random for aggregates and failure-biased for debugging.

**[Visual: Drift detection]** (`ch10-04-drift-detection.png`) — Lays out the three drift signals (score divergence, new failure modes, user-feedback contradiction) and their distinct fixes. Teaching point: drift isn't one phenomenon — diagnose *which* of the three you're seeing, because each routes to a different response (refresh dataset / expand evals / update criteria).

**[Visual: The flywheel loop]** (`ch10-05-flywheel-loop.jpg`) — Production experience → labeled data → better evals → better improvements → better experience, drawn as a closed circle. Teaching point: online monitoring is the mechanism that turns the flywheel; without the feedback-to-dataset step, the loop is open and the agent stops learning from reality.

**[Visual: Alerting thresholds]** (`ch10-06-alerting-threshold.jpg`) — Summarizes the alert triggers and hygiene rules (code/judge/latency/complaint/refusal thresholds; set-before-launch; rolling averages; response procedures). Teaching point: good alerting is decided in advance and is actionable — an alert without an owner and a first step is noise that teaches teams to ignore alerts.

## How this connects to: simulation / dataset strategy / synthetic data / actual data
- **Actual data is the star of this module.** Online monitoring is the discipline of treating *real production traces* as the source of truth that no curated set can match. The recurring lesson: reference datasets go stale; production is what's real.
- **Dataset strategy is the closing move of every drift response.** Score divergence → add production traces and rebalance the reference set (the dataset-refresh process). New failure modes → new trace codes feed new dataset slices. Regressions → failing traces get labeled into the set as regression tests. The case-study team kept *adding 10 production traces/week* to build out a new API-specific dataset slice — dataset strategy as an ongoing, monitoring-fed activity, not a one-time build.
- **Synthetic data is what online monitoring eventually *replaces or corrects*.** Pre-launch you often lean on synthetic/anticipated cases because you don't have production traffic yet. The whole drift story is the gap between those anticipated cases and the messy real distribution. Production traces and user edits become **golden examples** — real labels that outclass synthetic guesses for the input types users actually send.
- **Simulation is the pre-launch counterpart; monitoring is the live continuation.** Offline simulation/eval = "what we knew to look for." Online monitoring = "what we didn't anticipate." They're two halves of one quality system, and the bridge between them is the dataset that keeps absorbing production reality.

## Working with ML / eng teams
- **Reuse, don't rebuild.** The same code evals and LLM judges from offline run in production. The PM ask to eng is to wire them into the live trace pipeline with a sampling layer, not to author new evaluators from scratch.
- **Code evals on 100% of traffic** is an eng feasibility conversation — confirm the deterministic checks are cheap enough to run on everything (they almost always are).
- **Judge sampling rate is a cost conversation.** LLM judge calls on every trace are expensive at scale; cost sets the ceiling. PM sets the floor: weekly sample must yield 50–100 evaluated traces to be statistically usable. Negotiate the rate between those bounds.
- **Instrument the operational signals** (latency P95, error/timeout rates, token usage, cost-per-interaction) — these usually live in eng's existing observability stack; the PM job is to get them onto the *same* quality dashboard as eval scores so they're read together.
- **Alert plumbing is shared work**: eng builds the triggers and rolling-average computation; PM owns the thresholds, the response procedures, and the escalation rules.
- **The drift-to-fix loop is cross-functional and time-boxed.** The case study's fix path — trace analysis on 30 tickets → new trace code → 15 dataset examples → prompt update → rerun offline evals → ship — spans PM (analysis, criteria), ML/eng (prompt, retrain/redeploy), and a shared <10-day SLA.

## Role of design
- **Design owns the feedback-capture surfaces.** Thumbs up/down is biased and unreliable as a standalone metric (satisfied users rarely click up; very dissatisfied users rarely click down) — so design's job is to create *better* signals: well-timed explicit in-context prompts ("Is this category correct?") that collect targeted feedback at the exact moment the user can judge the output.
- **Design enables the richest signal — user edits.** Letting users easily edit an agent's output before accepting it both improves their experience *and* harvests golden examples. The edit affordance is a design decision with direct dataset value.
- **Session experience is itself a signal.** Heavy editing, course correction, and retry loops show frustration without explicit feedback. Designing flows that are observable (so replays surface these patterns) turns silent friction into measurable signal.
- **Latency is a design/experience constraint, not just an eng metric.** The 40-seconds-but-perfect-score example is fundamentally about whether the experience set the right expectation for response time. Design and PM define the SLA that the latency alert enforces.

## Process to follow
1. **Before launch:** decide sampling strategy (random + stratified + failure-biased mix), set sampling rates (code 100%; judges 1–10% sized for 50–100 traces/week), and set every alert threshold while thinking clearly about quality standards.
2. **Week 0 setup:** wire offline code evals + judges to a sample of live traces; stand up dashboards; configure alerts (e.g. category accuracy < 85%, empathy judge < 75%, P95 latency > 2s) with 7-day rolling averages and a written response procedure per alert.
3. **Steady state:** watch the offline↔online gap. A modest gap (e.g. 89% online vs 92% offline) is *expected* from more diverse production inputs — don't over-react.
4. **On a drift signal:** diagnose which of the three it is → route to the matching fix (refresh dataset / expand evals & trace codes / update criteria & build new judges).
5. **Close the loop:** label the failing/edited traces, add them to the reference dataset, rerun offline evals to set a new baseline, ship the updated agent, and keep adding production traces weekly to harden the new slice.
6. **Hold the SLA:** aim for detection-to-fix in under 10 days.

## References & sources
- **Reforge** — course module "**User Monitoring**" (for AI agents), watched via the Reforge / Docebo SCORM player. Source URL: `https://cdn5.dcbstatic.com/files/r/e/reforge_docebosaas_com/...//scormcontent/index.html#/`
- **Module lessons:** (1) Intro; (2) Detecting Drift: When Offline and Online Diverge; (3) Building the User Feedback Loop; (4) Recap and Further Learning.
- **Cross-references to sibling course modules:** Module 3 (confidence framework — refusal/"I don't know" thresholds); Module 4 (trace analysis cycle, trace codes); Module 6 (code evals — category label, schema validation, hallucination guard); Module 7 (LLM judges — empathy, actionability, factual grounding); Module 8 (dataset refresh process). The course Introduction defined the **AI Product Flywheel**. The *next* module covers evaluating complex multi-step agentic systems (failures at the routing, skill, and full-path levels).
- **Running example / case study:** the **Support Triage Agent** (categories: Technical, Billing, Feature Request; later + API Integration).
- **Key glossary terms defined in the module:** Online evaluation; Eval drift; Composite North Star; Failure-biased sampling.
- **Source Notion page:** "Reforge User Monitoring Module — Learning Session Notes" (2026-06-06), parent database "Meeting Notes."
- **Images referenced (6):** `ch10-01-offline-online-gap.jpg`, `ch10-02-monitoring-archite.png`, `ch10-03-sampling-strategie.jpg`, `ch10-04-drift-detection.png`, `ch10-05-flywheel-loop.jpg`, `ch10-06-alerting-threshold.jpg`.
- **Memorable framings to quote in teaching:** "pre-flight checklist vs. cockpit instruments"; "one support ticket is an anecdote, five about the same pattern is a trace code"; "an alert without a response procedure is just noise."

## Skill / template / app ideas
- **Monitoring Setup Canvas (template):** a fill-in-before-launch one-pager — sampling strategy & rates, the 6 alert thresholds with rolling-average windows, and a response-procedure row per alert (owner / first check / escalation). Forces the "decide while calm" discipline.
- **Drift Triage skill (`/drift-triage`):** paste offline vs online numbers + recent feedback summary → classify into the three drift signals → output the matching fix path and which module/process to invoke.
- **Ticket-to-Trace-Code aggregator:** ingest support tickets, cluster by theme, and flag when any cluster hits the "5 = trace code" threshold; auto-draft a candidate trace code and pull the queries for dataset addition.
- **Edit-to-Golden-Example harvester:** capture user edits to agent outputs, diff original vs accepted, and stage the accepted version as a golden example for review.
- **Composite North Star calculator:** combine thumbs-down rate + edit rate + retry rate + support-ticket correlation into one tunable satisfaction index with a dashboard tile.
- **Sample-size advisor (micro-tool):** input weekly traffic + target judge sample size (50–100) → recommended judge sampling % and rough inference cost.
- **<10-Day Drift-to-Fix tracker:** a board that timestamps detection → analysis → dataset update → ship, surfacing any loop exceeding the SLA.

## Teaching notes (for the instructor)
- **Lead with the gap, not the mechanics.** Open with the "92% pass rate while tickets pile up" scenario — the visceral fear of an invisible regression is what makes PMs care about monitoring. Then introduce sampling and alerting as the cure.
- **The pre-flight/cockpit analogy is your spine.** Reach for it whenever someone asks "why isn't offline enough?"
- **Hammer that a small offline↔online gap is normal.** New PMs panic at 89% vs 92%. Teach them to expect a gap from input diversity and to look at *trend and segment breakdowns*, not the headline number. (In the case study, the alarm came from one *segment* dropping to 81%, not the aggregate moving.)
- **Make the three drift signals a diagnostic flowchart, not a list.** The teaching payoff is that each signal has a *different* fix; conflating them sends teams to the wrong remedy. Signal 3 (feedback contradiction) is the subtle, high-value one — "your evals pass but you're measuring the wrong thing."
- **Use the case study as a live walkthrough.** Week 0 → Week 1 (calm) → Week 3 (API tickets, segment drop) → Week 5 (recovered) is a tidy narrative arc; have students name the action at each step before revealing it.
- **The "anecdote vs trace code" line is a sticky takeaway** — use it to teach the discipline of not over-fitting evals to a single complaint while still capturing systemic patterns.
- **Tie alerting hygiene to org behavior.** The deeper lesson isn't statistics; it's that un-owned, noisy alerts get ignored. Emphasize thresholds-before-launch and a response procedure per alert as cultural, not just technical, practices.
- **Transcript note:** the session transcript is an auto-captured voiceover and contains garbles ("trace"→"phrase"/"flammed", "support tickets"→"support to get teams", "skill levels"→"scale levels"). Don't quote it verbatim; the clean lesson text above the transcript is canonical. (There are also some unrelated ambient lines at the very end — "Mama?" etc. — ignore them; they're stray audio, not content.)
- **Bridge to the next module** explicitly: monitoring scores a single agent's outputs; next we decompose *multi-step agentic systems* where quality breaks at routing, skill, and full-path levels — monitoring those needs the same discipline applied at each seam.
