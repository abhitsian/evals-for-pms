# Chapter 9 — Measuring LLM Judge Alignment

## In one line
An LLM judge's verdict is an opinion, not a fact — calibration is the process of comparing that opinion against human labels, trace by trace, until you can quantify exactly how much to trust it (via two numbers: True Positive Rate and True Negative Rate).

## Why it matters for PMs
In Module 7 you (or your team) built LLM judges. This module is about whether you should trust them, and how much. A judge that returns Pass/Fail with a reasoning string *looks* authoritative — it runs at scale and is cheap relative to human review. But authority is not accuracy.

The trap PMs fall into constantly: a team builds a judge, runs it on their dataset, sees an 85% pass rate, and treats that number as if it means something about quality. It doesn't, yet. **A pass rate only tells you what the judge thinks. Calibration tells you whether the judge thinks the same way your domain experts do.**

The line that should stick with every PM: **an uncalibrated judge is worse than no judge.** With no judge, you know you're flying blind and behave accordingly. With an uncalibrated judge, you *believe* you've automated quality measurement — so your team ships on judge scores that were never validated against human assessment. Then everyone is surprised when user complaints don't track with the green numbers on the dashboard. The metric that was supposed to catch quality problems was silently letting them through.

For a PM, calibration is the difference between a release gate you can defend in a launch review and a vanity metric. It's also a resourcing decision: calibration tells you where to spend scarce human-review hours (the dimensions where automation fails) versus where to let the judge run unattended.

## Core concepts
- **Calibration** — comparing an LLM judge's verdicts against human labels on the *same* set of traces, to measure agreement and improve the judge's reliability. The whole game.
- **Confusion matrix** — a 2×2 table that sorts every judge verdict into one of four outcomes by cross-tabulating the judge's call against the human's call.
  - **True Positive (TP):** Judge = Pass, Human = Pass. Agreement on quality.
  - **False Positive (FP):** Judge = Pass, Human = Fail. The judge let a bad output through. **This is the dangerous quadrant for production.**
  - **False Negative (FN):** Judge = Fail, Human = Pass. The judge rejected good work — wastes engineering time investigating non-problems.
  - **True Negative (TN):** Judge = Fail, Human = Fail. Agreement on failure.
- **True Positive Rate (TPR) / Sensitivity** — of all the outputs humans labeled Pass, what fraction did the judge also Pass? Measures how reliably the judge catches *good* outputs. **TPR = TP / (TP + FN).**
- **True Negative Rate (TNR) / Specificity** — of all the outputs humans labeled Fail, what fraction did the judge also Fail? Measures how reliably the judge catches *bad* outputs. **TNR = TN / (TN + FP).**
- **Leniency bias** — most uncalibrated judges are too lenient (heavy on false positives) because LLMs default to positive, agreeable assessment unless the prompt forces them to be critical. A judge heavy on false negatives is the opposite — too harsh.
- **Aggregate pass rates lie.** Two similar-looking pass rates (e.g. human 70% vs. judge 77%) can hide huge trace-level disagreement — in the worked example, only 60% of individual traces actually agreed, barely better than a coin flip.
- **Near-miss examples** — traces that look fine on surface inspection but fail the specific criterion. The single highest-leverage fix for low TNR.
- **The ceiling** — the point where no existing model can reliably assess the quality dimension, no matter how good the prompt. Shows up as TPR/TNR stuck below 80% despite iteration.

## The mental model — how to think about this
Treat the judge like a junior analyst whose work you're auditing before you give them sign-off authority. You don't ask "what's their average score?" — you ask "when they say *good*, are they right? when they say *bad*, are they right?" Those are two separate questions with two separate answers, and a judge can be excellent at one and useless at the other.

The diagnostic move is to **decompose a single pass rate into two reliability numbers (TPR and TNR)**, because they fail in opposite, asymmetric ways and require opposite fixes:
- Low TPR → the judge is too harsh, rejecting good work. Loosen criteria.
- Low TNR → the judge is too lenient, waving bad work through. Tighten fail conditions, add near-miss examples.

**TNR is almost always the harder number to move**, because LLMs are trained to be agreeable. Getting a model to reliably *catch failures* takes more deliberate prompt engineering than getting it to *recognize successes*. So when a PM hears "our judge has a 90% pass rate," the right reflex is suspicion, not relief — that number is probably TPR-flattering and TNR-blind.

The second mental shift: **calibration is a loop, not a calculation.** You don't compute a matrix once and declare victory. You label → run → measure → read disagreements → refine → measure again, exactly the way the rest of AI development works.

## Key frameworks / steps / loops

### The Calibration Workflow (6 steps)
Built on the train/dev/test dataset splits from Module 8, to prevent overfitting.

1. **Collect human labels.** Select 50–100 representative traces; a domain expert labels each Pass/Fail. Two non-negotiable rules: (a) **the labeler applies the *exact same criterion* as the judge** — if the judge evaluates "empathetic acknowledgment before resolution," the human evaluates exactly that, not "overall tone" or "I liked it"; misaligned criteria show up as low agreement no matter how good the prompt is. (b) **Include the hard cases** — borderline traces where reasonable people might disagree; only-obvious traces give artificially high agreement and zero information. Split into **dev (~⅓)** and **test (~⅔)**. Never use test traces to refine the judge.
2. **Run the judge on the dev set.** For each trace record three things: the verdict (Pass/Fail), the **reasoning string**, and the human label. The reasoning string is what makes step 4 possible.
3. **Build the confusion matrix.** Compute TPR and TNR. Don't panic at low first-run numbers — uncalibrated judges commonly score **60–75% TPR and 20–40% TNR**. A 27% TNR on a first pass is typical, not an outlier.
4. **Read every disagreement.** The most important step and the one most teams rush. The reasoning string explains each call. Categorize disagreements into patterns:
   - **Criterion misunderstanding** — judge interpreted the question differently than you intended (a prompt-clarity problem).
   - **Missing boundary examples** — judge doesn't know where the line sits for an edge case (needs a teaching example).
   - **Leniency bias** — judge defaults to Pass on ambiguous cases; the most common source of low TNR.
   - **Domain knowledge gap** — judge lacks the context to assess at all; harder to fix with prompting and may signal a ceiling.
5. **Iterate on the prompt — targeted, one change at a time** so you can measure the effect. The highest-leverage single fix for low TNR: **add 3–4 well-chosen near-miss examples**, which typically improve TNR by **15–25 percentage points**. Re-run on dev and rebuild the matrix after each change; track metrics across rounds.
6. **Validate on the test set — run exactly once.** This is the number you report and ship on. If test metrics are **>5 points below dev**, you've overfit to the dev traces — simplify the most recent changes and re-validate. If within 5 points, the judge is calibrated: **document TPR, TNR, the final prompt, and the date** as your baseline.

### Reliability tiers — how to *use* the result
| Profile | What it means | How to deploy |
|---|---|---|
| TPR ≥ ~92%, TNR ≥ ~88% | Catches most issues, rarely false-alarms | **Hard release gate** — a failing pass rate blocks the ship |
| High TPR, low TNR (e.g. 95% / 65%) | Approves too many bad outputs | **Monitoring signal only**, not a gate; pair with periodic human review of passed traces |
| Low TPR, high TNR (e.g. 70% / 90%) | Too conservative; blocks good work, creates investigation overhead | Loosen criteria, or **split into two narrower judges** each able to hit balanced reliability |

### Drift & recalibration loop
Judge alignment **drifts** as the product evolves and user distribution shifts — a judge calibrated on B2C billing tickets loses reliability when the agent starts fielding developer integration questions. **Schedule quarterly recalibration:** label 50 fresh production traces, rebuild the confusion matrix, compare new TPR/TNR against the deployment baseline. (Coding agents can now automate much of this — far less cumbersome than even six months ago.)

### The ceiling decision tree
A judge hits its ceiling when no existing model can reliably assess the dimension. **Three signals it's a ceiling, not a prompt problem:**
1. Reasoning strings show *genuine confusion*, not misapplied criteria — no prompt fixes missing domain knowledge.
2. Adding more examples stops moving the metrics (<2–3 points per round).
3. **Inter-annotator agreement among humans is also low** (>20% disagreement) — the criterion itself is too ambiguous; tighten the definition before blaming the judge.

When you hit the ceiling, the answer is **structured human review, not abandoning measurement**: use code-based evals for structure/safety, LLM judges where calibration works, and human review only where it fails. Sample 5–10% of traffic with a **stratified approach** (best *and* worst outputs by automated score — reviewing only low scorers creates blind spots). Set explicit thresholds: *"3 domain reviewers assessed 20 outputs and 90% met criteria"* — not *"a human looked and it seemed fine."* Permanent human-review fallback is a signal to invest in a better judge or simpler criterion; most teams successfully recalibrate after 3–4 product iterations once the output distribution stabilizes.

## Visual explainers

**[Visual: The Confusion Matrix — Empathy Judge, 100 traces]** (asset `ch8-01-confusion-matrix.jpg`) — Shows the 2×2 grid for the worked example: rows are Human PASS (70) / Human FAIL (30); columns are Judge PASS (77) / Judge FAIL (23). The cells: TP=55, FP=22, FN=15, TN=8. *Teaching point:* the two row totals (70 vs. 77) look almost identical, yet the body of the table reveals the judge passed 22 outputs humans would fail. From these cells: TPR = 55/(55+15) = 79%; TNR = 8/(8+22) = 27%. The asymmetric failure profile — decent at recognizing good, nearly useless at catching bad — is invisible in the pass rate and only appears once you build the matrix.

**[Visual: The Calibration Workflow loop]** (asset `ch8-02-calibration-workflo.png`) — Depicts the iterative six-step cycle: label → run → measure → read disagreements → refine prompt → measure again, looping until target metrics are met, with the dev/test split feeding it. *Teaching point:* calibration is a loop you exit on a metric, not a one-shot script — and the test set sits *outside* the loop, touched only once at the end.

**[Visual: Prompt fixes by disagreement pattern]** (asset `ch8-03-prompt-fixes.jpg`) — Maps the four disagreement categories (criterion misunderstanding, missing boundary examples, leniency bias, domain knowledge gap) to their corresponding fixes, highlighting near-miss examples as the highest-leverage move for low TNR. *Teaching point:* reading reasoning strings isn't busywork — each disagreement pattern points to a *different* targeted edit, and matching the fix to the pattern is what makes iteration efficient.

**[Visual: Ceiling decision tree]** (asset `ch8-04-ceiling-decision-tr.jpg`) — A decision flow for distinguishing "fixable prompt problem" from "hard ceiling," routing through the three ceiling signals to either continued iteration or structured human review. *Teaching point:* knowing when to *stop* calibrating is as valuable as the calibration itself; the tree keeps you from burning iterations on a dimension no model can assess.

## How this connects to: simulation / dataset strategy / synthetic data / actual data
- **Dataset strategy (Module 8):** Calibration *is* the dev/test discipline applied to the judge itself. The same train/dev/test splits that prevent agent-eval overfitting prevent judge-prompt overfitting. Iterate on dev, validate once on test, watch for the >5-point gap. The judge is just another model being fit to data — and the test set is its honest scorecard.
- **Actual data:** Human labels are the ground truth, and they must come from *representative* traces including the hard, borderline cases — not cherry-picked easy ones. Recalibration explicitly pulls **fresh production traces** (50 per quarter), so the judge stays anchored to the real, drifting distribution rather than a frozen snapshot.
- **Synthetic data / near-miss examples:** The highest-leverage fix — near-miss examples added to the judge prompt — are curated *teaching* examples drawn from real false positives in the dev set. They function like targeted synthetic supervision: a small, deliberately chosen set that teaches the boundary between "adequate" and "good enough."
- **Simulation:** Calibration is the trust check that makes simulated/automated eval runs meaningful. A judge you'll run over thousands of simulated traces is only as good as its alignment on the 50–100 you hand-labeled; calibration is the bridge from "I ran 10,000 evals" to "those 10,000 numbers mean something."
- **Stratified sampling:** When automation hits the ceiling, sampling 5–10% of traffic by *both* best and worst automated scores keeps the human-review window honest about the full quality distribution, not just the failures.

## Working with ML / eng teams
- **Who labels:** Insist a real domain expert produces the human labels against the *exact* judge criterion. This is a PM-adjacent job; vague labeling ("seemed fine") silently destroys the calibration. Write the criterion down once, share it with both the labeler and the judge prompt.
- **Instrument the reasoning string.** Step 4 is impossible unless eng logs the verdict *and* the reasoning string *and* the human label per trace. Make this a requirement before calibration starts — reading disagreement reasoning is where the signal lives.
- **One change at a time.** Push back on eng instinct to rewrite the whole prompt after one bad run; demand targeted, measurable edits so you can attribute each metric move to a change.
- **Guard the test set.** Make it a team rule that test traces never touch prompt iteration. Treat a leaked test set the way you'd treat a leaked benchmark.
- **Coding agents do the grind now.** Much of the label-run-matrix-recalibrate cycle can be handed to coding agents — frame recalibration as a low-cost recurring job, not a heavyweight project.
- **Reliability tier drives architecture.** The TPR/TNR profile is a product decision input: gate vs. monitor vs. split-the-judge is something the PM owns, not a detail eng decides silently.

## Role of design
- **Surfacing confidence, not just verdicts.** If a judge's score gates a release or feeds a quality dashboard, design should communicate *which tier* the judge is in (hard gate vs. monitoring signal) so reviewers don't over-trust a low-TNR judge. A green number with a "monitoring only" treatment reads very differently from a green number on a validated gate.
- **Human-review UX.** Where automation hits the ceiling, the structured-review flow (stratified sampling, documented rubric, minimum sample size) is a designable surface — reviewers need the rubric, the trace, and the automated score in one view to label efficiently.
- **The empathy criterion itself is a design artifact.** The case study turns on the distinction between *factual* acknowledgment ("I see you were charged twice…") and *empathetic* acknowledgment (concern, understanding, urgency). That distinction is a content/UX-writing standard; design and content partners should co-own what "good" means before it's encoded into a judge.

## Process to follow
1. Pick one judge and one criterion. Write the criterion in one unambiguous sentence.
2. Pull 50–100 representative traces, including deliberately hard/borderline ones. Have a domain expert label each Pass/Fail against that exact criterion.
3. Split dev (~⅓) / test (~⅔). Quarantine the test set.
4. Run the judge on dev; log verdict + reasoning string + human label per trace.
5. Build the confusion matrix; compute TPR and TNR. Expect low TNR.
6. Read *every* disagreement; categorize into the four patterns.
7. Make one targeted prompt change — start with 3–4 near-miss examples for low TNR. Re-run dev, rebuild matrix, record the round.
8. Repeat 6–7 until you hit target (most judges reach ~90/90 in 3–5 iterations).
9. Run the test set **once**. If within 5 points of dev, ship; if >5 below, simplify and re-validate.
10. Document TPR, TNR, final prompt, date → baseline. Choose deployment tier (gate / monitor / split).
11. Schedule quarterly recalibration on 50 fresh production traces; compare to baseline.
12. If 5+ iterations can't push both metrics past 80%, run the ceiling checks; if it's a true ceiling, switch that dimension to structured human review with an explicit threshold.

## References & sources
- **Source module:** *Reforge — "Measuring LLM Judge Alignment"* (Module 9 of an evals course), delivered via Reforge / Docebo SCORM. Four lessons: (1) Intro + Confusion Matrix Method, (2) The Calibration Workflow, (3) When LLM Judges Hit Their Ceiling, (4) Recap and Further Learning.
- **Cross-referenced modules within the same course:**
  - **Module 7** — building LLM judges (the empathy judge for the Support Triage Agent originates here; reference-free judge checking empathetic acknowledgment before resolution).
  - **Module 8** — train/dev/test dataset splits and overfitting prevention (the splitting discipline this module relies on).
  - **Module 4–9 / next module** — using the eval infrastructure to systematically improve agent quality via prompt iteration, model upgrades, and architectural changes.
- **Embedded images (assets):** `ch8-01-confusion-matrix.jpg`, `ch8-02-calibration-workflo.png`, `ch8-03-prompt-fixes.jpg`, `ch8-04-ceiling-decision-tr.jpg`.
- **Worked example / running case study:** the Empathy Judge for a customer-support / Support Triage Agent (B2C billing tickets).
- **Concepts referenced from the broader eval canon:** confusion matrix, sensitivity/specificity (TPR/TNR), inter-annotator agreement, stratified sampling, overfitting, dev/test validation.
- *No external books, papers, or named authors were cited in the module; references are internal to the Reforge course.*

## Skill / template / app ideas
- **`/calibrate-judge` skill** — takes a set of traces + human labels + a judge prompt, runs the judge, builds the confusion matrix, computes TPR/TNR, surfaces every disagreement with its reasoning string, and suggests which of the four disagreement patterns each falls into.
- **Confusion-matrix calculator (static app)** — paste TP/FP/FN/TN (or upload a labeled CSV) → returns TPR, TNR, trace-level agreement, and a deployment-tier recommendation (gate / monitor / split).
- **Near-miss miner** — from a dev-set run, auto-rank false positives by how "surface-plausible" they are and propose the 3–4 best near-miss examples to add to the judge prompt.
- **Calibration baseline ledger (Notion template)** — one row per judge: criterion, dev/test TPR & TNR, final prompt, date, deployment tier, next recalibration date. Feeds quarterly drift checks.
- **Recalibration cron** — quarterly job that pulls 50 fresh production traces, re-runs the judge, rebuilds the matrix, and flags drift vs. baseline (the coding-agent-automates-this idea, productized).
- **Ceiling-check checklist** — a 3-signal triage template to decide, before the team burns more iterations, whether a stuck judge is a prompt problem or a real ceiling.

## Teaching notes (for the instructor)
- **Lead with the one-liner that lands:** "an uncalibrated judge is worse than no judge." It reframes the whole module from a math lesson into a risk lesson, which is what PMs care about.
- **Make them feel the lie of the pass rate.** Open with the 70% vs. 77% pass-rate example *before* revealing trace-level agreement is only 60%. The gap between "looks fine" and "is fine" is the emotional hook.
- **Hand-compute one matrix live.** Walk TPR = 55/70 = 79% and TNR = 8/30 = 27% by hand. The asymmetry (good at catching good, useless at catching bad) is the single most memorable takeaway; let it sink in before moving on.
- **Anchor everything to the empathy case study.** The three rounds (22% → 67% → 89% TNR) are a clean, concrete arc. Use the exact failing trace — *"I see you were charged twice. Please follow these steps…"* — to make "factual vs. empathetic acknowledgment" tangible. That one sentence teaches near-miss examples better than any abstraction.
- **Emphasize TNR is the hard one** and *why* (LLMs are trained to be agreeable). PMs who internalize this will stop being reassured by high pass rates.
- **Stress the discipline points** that teams skip: reading *every* disagreement (step 4), changing *one thing at a time* (step 5), and running the test set *exactly once* (step 6). Frame each as a way teams fool themselves.
- **Common misconception to preempt:** low first-run numbers mean the judge is broken. No — 60–75% TPR / 20–40% TNR is a *normal* starting point. The work is the iteration.
- **End on knowing when to stop.** The ceiling section prevents the failure mode of infinite prompt-tinkering. The contrast — *"a human reviewed it and it seemed fine"* vs. *"3 reviewers assessed 20 outputs, 90% met criteria"* — is a great closer on what rigor actually looks like.
- **Real-effort calibration anchor:** the case study took *3 iterations over 2 days*, mostly spent reading reasoning strings. Set that expectation so PMs budget for it.
