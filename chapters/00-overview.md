# Evals for PMs — Course Overview

## The thesis in one paragraph

AI products break the contract traditional software made with product managers. A deterministic feature either exists or it doesn't, and a usage funnel tells you whether people are getting through it. An agentic product built on a frontier model usually *already has* the core capability at launch — it just performs unreliably, producing a wide distribution of personalized outcomes rather than one happy path. So the PM's job shifts from "get the user to the end of a flow" to "guarantee the quality of the work the AI does at the end of that flow." This course teaches the operating system for doing that: a closed-loop measurement discipline (the **AI Flywheel**) in which you define what "good" means, read real traces to learn where the system fails, build datasets that mirror production's hard cases, automate scoring with code checks and calibrated LLM judges, iterate on the agent with controlled experiments, and monitor live traffic so production surprises feed back into the loop. Evaluation stops being a one-time pre-launch gate and becomes the thing that sets your team's velocity — the difference between shipping a new model the day it drops and "still evaluating it three weeks later."

## The through-line: the AI Flywheel

Chapter 1 introduces the five-phase **AI Flywheel** — Agent Success Rate → Trace Analysis → Reference Datasets → Offline Evaluation → Online User Monitoring → (back to) Agent Success Rate. Every other chapter is a deeper drill into one phase of that loop, or the connective tissue (PRD, iteration, complex-agent decomposition, tooling) that makes a phase work. Here is the full map:

| # | Chapter | Flywheel phase it serves |
|---|---------|--------------------------|
| 1 | The AI Flywheel | **Defines the whole loop** + Agent Success Rate (north star) + the two-layer eval stack (model vs. application) |
| 2 | The AI Eval Lifecycle | **Spans the loop across product stages** — Vibe Checks (prototype) → Offline Evals (build) → User Monitoring (optimize); "Demo before Memo" |
| 3 | AI-Native PRD Writing | **Defining "good"** — encodes Agent Success Rate, golden outputs, and the rubric into the spec; the "I don't know" threshold |
| 4 | Principles of Trace Analysis | **Phase 2: Trace Analysis** — sourcing diverse inputs (User Input Grid), free-form review, binary trace codes; the seed of everything downstream |
| 5 | Principles of Automated Evaluation | **Bridge into Phase 4** — triage which failures become evals (spec/architecture/generalization gaps); code-first, judge-second |
| 6 | Writing & Scaling Code-Based Evals | **Phase 4: Offline Evals (deterministic floor)** — Python pass/fail checks; release gates |
| 7 | LLM Judge-Based Evaluation | **Phase 4: Offline Evals (subjective ceiling)** — judges for tone, actionability, grounding, completeness |
| 8 | Managing Eval Datasets | **Phase 3: Reference Datasets** — seed, grow, balance, split, govern; synthetic → production transition |
| 9 | Measuring LLM Judge Alignment | **Trust layer under Phase 4** — calibrate judges against humans (confusion matrix, TPR/TNR) |
| 10 | Iteration to Improve Agent Quality | **Turns measurement into improvement** — diagnose → hypothesize → one change → measure → ship/revert; the three levers |
| 11 | User Monitoring | **Phase 5: Online Monitoring** — sample live traffic, detect drift, feed surprises back; "spinning the flywheel" |
| 12 | Evaluating Complex AI Agents | **Phases 2–4 applied to multi-step agents** — decompose into routing/skills/full-path; tool-call & recovery evals; simulation |
| 13 | Failure Funnels | **Visualizing Phase-4 results for complex agents** — step-level vs. cumulative pass rates; the bottleneck; transition matrix |
| 14 | Vibecoding Trace Analysis Apps | **The tooling that accelerates Phases 2–4** — build custom review/calibration/dashboard apps to make the human loop ~10x faster |

The shape to teach: **Chapters 1–3 set up the loop and what "good" means. Chapter 4 is the source of truth that feeds the dataset (8) and the evals (5–7), whose trustworthiness depends on calibration (9). Chapter 10 turns all of that into product improvement; Chapter 11 closes the loop with production. Chapters 12–14 scale the same machinery to complex agents and accelerate the human bottleneck with custom tools.**

## How to think like an eval-driven PM (the distilled principles)

1. **Measure work, not usage.** Engagement, retention, and funnel completion are silent on whether the AI resolved intent, made the right trade-offs, followed the constraints that matter, and failed acceptably. The new north star is **Agent Success Rate** — a composite over a *distribution* of outcomes, with an honest "unknown" bucket. (Ch 1)
2. **Demo before memo.** You can't spec what you haven't felt. Prototype and vibe-check first; the PRD's job is to define the quality bar (golden outputs + rubric + "I don't know" threshold), not to enumerate features — because for agentic products the capability is free and the reliability is the work. (Ch 2, 3)
3. **Observe before you score.** Read raw traces free-form before building any dashboard. Skipping straight to automated metrics produces rigorous-looking numbers that don't reflect reality. Stay qualitative long enough that the categories you automate are real, binary, and agreed-on (>90% inter-rater agreement). (Ch 4)
4. **Triage before you build; cheap before expensive.** Most failures are *not* eval candidates — they're spec gaps (fix the prompt) or architecture gaps (fix the plumbing). Only generalization gaps earn an eval. Then: code-based checks first, LLM judges only for genuinely subjective criteria, model swaps only after prompt levers are exhausted. (Ch 5, 6, 7, 10)
5. **Your evals are only as good as your dataset — and your judges are only as good as their calibration.** Mirror difficulty, not frequency. Make the synthetic→production transition early. An uncalibrated judge is *worse* than no judge, because it makes you believe you've automated quality. (Ch 8, 9)
6. **Evals measure; experiments improve.** Infrastructure is not the goal. Quality comes from controlled experiments run against that instrument — one change at a time, same reference dataset, per-eval deltas, ship/iterate/revert on evidence. (Ch 10)
7. **Shipping is not the finish line — it's when your test set starts going stale.** Production is a data generator, not just a delivery channel. Watch the offline↔online gap; every production surprise is a new test case; every alert needs a named owner and a first step. (Ch 11)
8. **For complex agents, a headline score is a lie that hides a roadmap.** "55% success" is usually several 95% components plus one 76% bottleneck. Decompose, find where the funnel pinches *earliest*, and fix upstream first. (Ch 12, 13)
9. **Speed of trace review sets the speed of the whole flywheel** — so build the jig that makes the human fast, and own it yourself. (Ch 14)

## Who this course is for / prerequisites

**For:** product managers (and the designers who partner with them) shipping AI/agentic features built on frontier models — anyone who owns the definition of "good" for an AI product and is accountable for its quality in a product review. The course repeatedly insists this is **PM-led, not delegated to ML engineers**: an engineer can implement a rubric, but only product/design can define what great means for your users.

**Prerequisites:** comfort writing a traditional PRD; familiarity with how LLM products behave (prompts, tools, context). No ML research background is required — the course operates entirely at the *application* layer, not the model layer. Light Python literacy helps for Chapters 6 and 14 but is not assumed; the vibecoding chapter exists precisely so non-coders can build their own tooling.

## Suggested teaching sequence and pacing

The chapters already cluster into four teachable modules. A workable cadence (each "day" ≈ a 2–3 hour session or a self-paced week):

| Module / Day | Chapters | Theme | Why grouped |
|---|---|---|---|
| **Day 1 — Foundations & framing** | 1, 2, 3 | The flywheel, the lifecycle, the AI-native PRD | The mental reset (usage→work, spec→quality-bar, demo-before-memo). Nothing downstream makes sense without it. |
| **Day 2 — Seeing reality** | 4, 5 | Trace analysis + the triage decision (which failures become evals) | Ch 4 produces the raw material; Ch 5 is the hinge that routes each failure to prompt-fix / eng-fix / eval. |
| **Day 3 — Building the instrument** | 6, 7, 8, 9 | Code evals, LLM judges, datasets, judge calibration | The four pieces of a trustworthy offline eval suite. Teach 8 (datasets) right after 6/7 so judges have data; 9 (calibration) last, as the trust check. |
| **Day 4 — Improving & operating** | 10, 11 | The iteration loop + production monitoring | Where measurement becomes product gain and the loop closes. |
| **Day 5 — Scaling to complex agents** | 12, 13, 14 | Decomposition, failure funnels, custom tooling | The advanced track: same machinery applied to multi-step systems, plus the tooling that accelerates the whole program. |

Anchor every session on the **Support Triage Agent** running case study (introduced in Ch 2, carried through Ch 11) so the lifecycle feels like one continuous story; switch to the **text-to-SQL analytics agent** for the complex-agent track (Ch 12–13). Both are used end-to-end in the source material.

## The PM's eval maturity ladder (crawl → walk → run)

| Stage | What it looks like | The flywheel phases active | The risk if you stop here |
|---|---|---|---|
| **Crawl** | You vibe-check a prototype on 10–30 diverse inputs, label ✓/~/✗, capture a handful of golden outputs, and write an AI-native PRD that defines the quality bar. You read real traces yourself and name a few binary trace codes. | Define "good" (Ch 1–3) + early Trace Analysis (Ch 4) | This is where *most* teams stop — a single vibe check or one sub-100-input "overall correctness" eval. Numbers look credible, don't reflect reality. |
| **Walk** | You triage failures (spec/architecture/generalization), build a small code-eval suite as a release gate, add a couple of narrow LLM judges, calibrate them against human labels (TPR/TNR), and grow a governed dataset (train/dev/test, versioned) that mirrors production difficulty. You run controlled iteration experiments, one change at a time. | Reference Datasets (Ch 8) + Offline Evals (Ch 5–7) + calibration (Ch 9) + iteration (Ch 10) | You can ship on evidence and catch regressions — but you're still blind to what real users do at scale. |
| **Run** | Online monitoring runs code evals on 100% of traffic and judges on a 1–10% sample; you watch the offline↔online gap, diagnose the three drift signals, and feed every surprise back into the dataset within a <10-day detect-to-fix SLA. For complex agents you decompose into funnels, fix the earliest bottleneck, and report a predictable roadmap to leadership. You've vibecoded custom review tools that make the human loop ~10x faster. | **Full closed flywheel** (Ch 11) + complex-agent scaling (Ch 12–13) + tooling (Ch 14) | The flywheel compounds: production → labeled data → better evals → better improvements → better production. This is the goal state — exemplified by Notion's ~10x acceleration (3→30 issues/day, new models to prod in <24h). |

The ladder is the same flywheel, just spun at increasing radius. Crawl defines the loop; walk builds the instrument; run closes it on live traffic and scales it.
