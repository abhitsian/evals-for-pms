# Working with ML Teams & the Role of Design

This synthesis aggregates every "Working with ML/eng teams" and "Role of design" section across all fourteen chapters into one collaboration model. The course is emphatic on one point throughout: **evaluation is PM-led, not delegated.** An engineer can *implement* a rubric; only product (with design) can *define what great means for your users.* Teams that let ML engineers exclusively own trace review, rubric writing, and dataset labeling "discover quickly that product taste matters and development is slowed down" (Ch 3).

## The governing principle (stated, in some form, in almost every chapter)

> **PM owns the definition of "good"; eng owns automating and operating it; design owns the taste that becomes the standard and the surfaces that capture quality signal.**

- "PMs must lead from the trenches — *personally* reviewing traces and writing evaluation rubrics" (Ch 1).
- "Don't outsource quality definition" (Ch 3).
- "PMs lead on prioritizing and framing which properties get measured, and on setting the thresholds… Engineering runs the suite; the PM owns the bar" (Ch 6).
- "PM owns prioritization (*what to fix next*); engineers own execution (*how to fix it*)" (Ch 10).
- "The rubric-owner builds the [review] tool, removing a dependency on eng for internal tooling… collaboration-changing, not collaboration-eliminating" (Ch 14).

## RACI-style split by eval activity

R = Responsible (does the work), A = Accountable (owns the outcome), C = Consulted, I = Informed. Derived directly from each chapter's collaboration section.

| Eval activity | PM | ML / Eng | Design | Source |
|---|---|---|---|---|
| Define Agent Success Rate / north star | **A/R** | C | C | Ch 1 |
| Write the AI-native PRD (rubric, golden outputs, "I don't know" policy) | **A/R** | C | **C/R** (owns "great" + decline UX) | Ch 3 |
| Specify the tool surface (name, action, params, purpose) | **A/R** | C | I | Ch 3 |
| Build the trace logging / observability layer | C | **A/R** | I | Ch 1, 8, 12 |
| Source diverse inputs / build the User Input Grid | **A/R** | C | C | Ch 4 |
| Free-form trace review | **R** | **R** (catches tool/architecture fragility) | **R** (catches UX/formatting issues) | Ch 4 |
| Define binary trace codes (>90% agreement) | **A/R** | C | C (SME too) | Ch 4 |
| Triage failures (spec / architecture / generalization) | **A/R** | **C/R** (diagnoses architecture root cause) | I | Ch 5 |
| Decide code-eval vs. LLM-judge | **A/R** | C | C (for taste-based judges) | Ch 6, 7 |
| Implement & run code evals across the dataset; wire into CI | C (defines property + examples + threshold) | **A/R** | C (UI limits → thresholds) | Ch 6 |
| Write LLM-judge prompts (criterion, standard, boundary examples) | **A/R** | C | **C/R** (owns the taste/boundary examples) | Ch 7 |
| Set per-eval thresholds & stage gates (alpha/beta/GA) | **A/R** | C | C | Ch 5, 6 |
| Build & govern the dataset (sampling, balance, splits, versioning) | **A/R** (judgment calls) | **R** (plumbing: sampling at scale, sort-by-latency, versioning) | **R** (valid labeler; acceptability lens) | Ch 8 |
| Calibrate judges (confusion matrix, TPR/TNR, near-miss examples) | **A/R** (owns criterion, reads disagreements, picks deployment tier) | **R** (logs verdict+reasoning+human label; coding-agents automate the grind) | C (co-owns what "good" means, e.g. empathetic vs. factual) | Ch 9 |
| Run iteration experiments (one change, measure, ship/revert) | **A** (prioritization) | **R** (execution: prompt/model/architecture) | C (empathy/format quality bar) | Ch 10 |
| Maintain the experiment log | **A/R** (shared institutional memory) | **R** | I | Ch 10 |
| Production monitoring: sampling layer, alert plumbing, op metrics | C (sampling strategy, thresholds, response procedures) | **A/R** (wire evals to live pipeline, rolling averages, observability stack) | **C/R** (feedback-capture surfaces, latency SLA) | Ch 11 |
| Decompose complex agents into evaluable components | **A/R** (quality bar, labeled ground truth) | **R** (expose component boundaries in the trace; execution-accuracy tests) | C (uncertainty/failure UX) | Ch 12 |
| Build failure funnels & transition matrices | **A/R** (funnel for stakeholders/prioritization) | **R** (matrix for engineering diagnosis; per-step eval implementation) | C (funnel as communication artifact) | Ch 13 |
| Build custom trace-review apps (vibecoding) | **A/R** (now builds it; owns rubric) | C (API contracts, auth tokens, credentials) | C (information hierarchy, rendering fidelity) | Ch 14 |

## The PM ↔ ML/eng relationship, chapter by chapter

**Hand off the *right* problems (Ch 5).** Spec gaps are PM/prompt work; architectural gaps go to engineering (missing integrations, wrong tool definitions, model-capability limits). Don't ask eng to "build an eval" for broken plumbing. The three-question decision tree (spec → system → generalization) is a routing protocol the two roles run together.

**Frame model upgrades as eval problems, not research problems (Ch 2, 10).** The question isn't "is this model better in general" but "is it better for *this* product on *this* task, at a cost and latency we can accept?" — answerable in 24–48 hours if the eval set exists. The shared team goal: "if you can't ship a new model the day it drops, your bottleneck is evaluation." Cost and latency are *joint constraints* the PM weighs against the SLA (Ch 10).

**Code evals are an eng-friendly default (Ch 5, 6).** Deterministic, cheap, fast, and runnable *on the critical path* during a request to auto-retry on failure — wire them into the runtime, not just CI. Bring eng the *examples*, not just the rule: "Category: Billing…" → True and "This appears to be a billing-related issue." → False is far more implementable than "check the category is right." Passing/failing pairs are the spec.

**Sequencing and cost are contracts (Ch 7).** Code evals run first, every time; judges run only when code evals are green and the change is substantive. 50 items × 3 judges = 150 calls per run — agree with eng which judges run on which cadence (per-PR vs. per-release). Require structured JSON/YAML output so results flow into dashboards.

**Define the bar together, in advance (Ch 5, 6).** "We agreed 70% for beta. We're at 68%. Ship or iterate?" only works if PM + eng + design committed to the threshold *before* the result came in. Set thresholds before iterating, in writing; treat them as hard gates. The integrity rule (Ch 6): the decision whether 82% is good enough must not be made *after* you've seen 82% and want to ship.

**Shared debugging protocol (Ch 6, 9).** On any unexpected/0% pass rate, the first conversation is "is the eval buggy?" not "is the agent broken?" — read five reason strings together before touching the agent. For calibration, eng must log verdict + reasoning string + human label per trace, or step 4 (reading disagreements) is impossible. Push back on the eng instinct to rewrite the whole prompt after one bad run — demand targeted, one-change-at-a-time edits so each metric move is attributable.

**Collaborative trace review is the highest-bandwidth ritual (Ch 4, 10).** Each role catches a different failure class: PM brings product context ("this maps to our highest-volume ticket category"), eng brings technical log analysis ("the model loses context after the third tool call"), design catches UX/formatting issues, SME catches domain errors. The trace is the shared artifact because it captures intermediate steps, tool calls, tokens, and latency — common ground where everyone reasons about *what the system actually did*.

**Architecture & decomposition need eng evidence (Ch 10, 12).** Before committing expensive architecture work, the team must produce clear evidence the current architecture *can't* solve the problem — an engineering judgment the PM should demand and pressure-test. Decomposition requires eng to expose component boundaries in the trace (parsed intent, selected tool, extracted params, raw tool output, each step's I/O); if the trace only shows input and final output, no decomposition is possible — instrument first. Execution accuracy (run queries against a test DB, per the BIRD benchmark) is the gold standard, not syntax checks.

**The boundary moves with vibecoding (Ch 14).** The PM can now own the review tool: the person who knows the rubric and feels the friction builds and iterates it. Eng still owns the production integrations' contracts — auth tokens, API formats, rate limits, schema (the case-study LangSmith integration needed one round of auth-token debugging). Frame it as collaboration that *moves* the boundary, not removes it; a working trace app is a better alignment artifact than a doc.

## The role of design, consolidated

Design's involvement grows across the course from "not addressed" (Ch 1) to a named, load-bearing partner (Ch 3, 4, 7, 11, 14). The throughline: **design co-owns what "great" means and owns the surfaces that capture quality signal.**

**Design owns "great" alongside the PM (Ch 3).** The UX/UI spec is *replaced by a working prototype*; design quality is encoded in the golden outputs themselves ("you show, you don't describe"). Design's contribution shifts from screen layouts to shaping *output quality* and the *failure/decline experience* — what a graceful "I don't have enough information" moment looks and feels like.

**Design surfaces failure classes others miss (Ch 4).** In cross-functional trace review, designers catch UX issues and formatting problems — output structure, readability, presentation failures that don't register as "hard failures" but degrade the experience. Several trace codes are inherently design-adjacent ("tone feels off," "missed an opportunity to propose next steps," "consistently finds a unique format" as a *positive* differentiator).

**Design owns the taste definition that becomes the judge's standard (Ch 7).** A judge for "tone appropriate for a professional interaction" or "feels like slop vs. feels crafted" is design's quality bar operationalized into observable behaviors. Designers are the right source for the *borderline* examples where the line is genuinely contested, and the right eye to catch the **style-over-substance** trap (a verbose response that *looks* actionable while dodging the question). In calibration (Ch 9), the empathy criterion itself — *factual* acknowledgment vs. *empathetic* acknowledgment — is a content/UX-writing standard design and content partners should co-own before it's encoded into a judge.

**Design owns feedback-capture surfaces and the signals they produce (Ch 5, 11).** Thumbs up/down is explicitly *biased* — users rate experience (speed, tone, UI), not output quality. Design's job is to build surfaces that capture signal about the *output*: well-timed in-context prompts ("Is this category correct?"), inline comments, and especially the **edit-before-accept affordance** — letting users easily edit the agent's output both improves their experience *and* harvests golden examples ("the user is showing you what good looks like," Ch 11). Designing observable flows turns silent friction (heavy editing, retries, course-correction) into measurable signal.

**Design translates experience constraints into eval thresholds (Ch 6, 11).** UI limits become structure/format checks ("summary under 500 characters"); latency SLAs are perceived-performance decisions ("feels fast enough") that become threshold evals — the 40-seconds-but-perfect-score example is fundamentally an experience problem. When design changes a layout constraint, the corresponding eval threshold should change with it. Downstream-consumption contracts (the schema a UI component expects) are defined by design and guarded by the structure eval.

**Design communicates confidence and honesty (Ch 9, 12).** A green number under a "monitoring only" treatment must read differently from a green number on a validated gate, so reviewers don't over-trust a low-TNR judge (Ch 9). Surfacing uncertainty honestly is a design problem: the empty-result failure — *"There were no signups in Q3"* vs. *"the query returned no results, which may indicate a data issue"* — is as much UX as model behavior (Ch 12). Design owns how the agent asks a clarifying question on ambiguity, how a retry/fallback is shown without eroding trust, and how much of the multi-step path to expose so a slightly-longer path reads as thoroughness rather than floundering.

**Design owns information hierarchy in review tools (Ch 14).** In a custom trace app the core design job is what to surface vs. collapse (user input / output / tool calls / failure signals highlighted; metadata/reasoning/system tokens collapsed). Rendering fidelity needs hand-tuning (CSS tweaks to make an email render realistically — outsized payoff). Diff highlighting (golden label differences in yellow) makes disagreement scannable. Flow-state design — progress indicators, keyboard-first interaction, skip-reviewed nav — is measured in seconds-per-trace, not aesthetics.

## Handoffs, shared artifacts, and collaboration rituals

**Shared artifacts (the handoff contracts):**
- **The AI-native PRD** — the anchored spec eng starts from; must contain golden outputs from diverse inputs, the rubric, tool spec, and graceful-failure rules. Updated *every* iteration cycle (Ch 3, 10).
- **The golden / reference dataset** — the labeled handoff, not prose; the spine every eval runs against; co-grown via the production pipeline (Ch 2, 6, 8).
- **Binary trace codes (>90% agreement)** — the handoff contract that makes automated labeling trustworthy (Ch 4).
- **Passing/failing example pairs** — the implementable spec for each eval (Ch 6).
- **Rubrics & judge prompts** — design vets the standard and boundary examples (Ch 7).
- **The calibration baseline ledger** — criterion, dev/test TPR/TNR, final prompt, date, deployment tier, next recalibration date (Ch 9).
- **The experiment log** — shared institutional memory answering "have we tried X?" and "why aren't we on the newer model?" (Ch 10).
- **Dashboards** — per-eval pass rates, the offline↔online gap, failure funnels; operational metrics on the *same* dashboard as eval scores so they're read together (Ch 10, 11, 13).
- **The custom trace-review app** — itself a shared spec for aligning on rubric and taxonomy; PM owns it, eng owns its integration contracts (Ch 14).

**Collaboration rituals:**
- **Cross-functional free-form trace review** — 3–4 colleagues independently label the same 20 traces; meet to compare; refine; repeat to >90% agreement (Ch 4).
- **The 0%/read-five-reasons debugging huddle** — before blaming the agent (Ch 6).
- **Calibration sessions** — label → run → read every disagreement → one targeted change → re-measure (Ch 9).
- **Iteration cycles** — collaborative trace read, then PM prioritizes / eng executes / both update PRD + dataset (Ch 10).
- **Drift-to-fix loop** — time-boxed, cross-functional, <10-day SLA: PM (analysis, criteria) + eng (prompt, redeploy) (Ch 11).
- **Reporting cadence** — weekly internal (bottleneck + next experiment); bi-weekly/monthly to stakeholders (one-page funnel narrative) (Ch 13).
