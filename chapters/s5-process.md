# The End-to-End Eval Process a PM Runs

Each chapter has its own "Process to follow." This synthesis stitches them into one continuous operating process — from a new feature idea all the way to production monitoring and custom tooling — and tags each step with the chapter it draws from. Read it as the canonical playbook; read the per-chapter sections for depth.

## The playbook (24 steps, grouped by phase)

### Phase 0 — Reframe and prototype (before any spec)

**1. Adopt the work-not-usage frame.** Establish **Agent Success Rate** as the team's primary non-vanity metric: a composite of user feedback + user actions (download/accept) + semantic frustration signals, with an explicit "unknown" bucket. Where outcomes are verifiable, use a simpler direct metric (% ticket resolution, % suggestions accepted unedited). *(Ch 1)*

**2. Build a thin prototype — not the PRD.** A simple prompt + a few examples + a connector to real sample data. Don't write the spec yet. *(Ch 2)*

**3. Run a vibe check.** Generate 10–30 diverse, persona-spanning inputs; run each; label ✓ (would ship) / ~ (minor edits) / ✗ (unacceptable); note *why* each passed or failed. Coverage over rigor. *(Ch 2)*

**4. Capture golden outputs and edge cases.** These are the seed of the reference dataset and double as few-shot examples. Deliberately include messy cases (incomplete, contradictory, ambiguous). *(Ch 2, 3)*

### Phase 1 — Write the AI-native PRD (demo before memo)

**5. Now write the PRD — as a quality bar, not a feature list.** Translate each traditional section into its AI-native equivalent: goals→**rubric**, user stories→**golden outputs**, functional reqs→**prompt logic & tool spec**, UX spec→**working prototype**, +**edge-case handling**, open questions→**dataset strategy**. *(Ch 3)*

**6. Write the rubric (vibe-oriented for now).** State what accuracy means in *your* domain, acceptable trade-offs, and failures that are *never* allowed. (Sample targets: categorization >92%, sentiment precision >85%, latency <2s, hallucination 0%.) Don't reach for generic OOB tone/helpfulness metrics as primary success criteria. *(Ch 3)*

**7. Specify prompt logic, tools, and graceful failure.** System instruction; each tool's name/action/input param/purpose; rules for what the agent does when it can't fulfill the request. *(Ch 3)*

**8. Decide and spec the "I don't know" threshold per query type.** Place the product on the confidence-vs-failure-cost 2×2 (conservative for high-stakes domains; permissive for exploratory). Write the exact decline language and the fallback/reformulation/escalation. Target a 10–20% production "I don't know" rate (>30% = retrieval failing; <5% = fabricating). *(Ch 3)*

### Phase 2 — Trace analysis (the source of truth)

**9. Source a diverse input set; engineer diversity with a User Input Grid.** Define 3–5 dimensions → 2–3 grounded examples each → combine into a grid → prune implausible cells → add real-world constraints → have an LLM write 2–3 natural-language query variations per cell. *(Ch 4)*

**10. Review traces free-form — observe, don't score.** Read 30–50 traces manually. Take generous notes; capture failures *and* wins; watch for hard failures, soft quality issues, and differentiators. Don't formalize in the first ~10. *(Ch 4)*

**11. Cluster into binary trace codes.** Each = name + one-sentence definition + Yes/No criteria + 2–3 examples. Make it a team sport: 3–4 reviewers independently label the same 20 traces; meet, refine, standardize; repeat to **>90% agreement**. Stop at **saturation** (~10 consecutive traces add no new codes), tracked *per dimension*. Play offense — keep affirmative codes too. *(Ch 4)*

### Phase 3 — Triage which failures become evals

**12. Run each trace category through the three-question decision tree.** Q1 *Specification* (prompt incomplete?) → fix the prompt. Q2 *System* (never works?) → engineering fix. Q3 *Generalization* (works sometimes?) → **build an automated eval.** Only generalization gaps earn an eval. If humans can't agree on "passing," fix the requirement first — don't encode confusion. *(Ch 5)*

### Phase 4 — Build the automated eval suite (code floor, judge ceiling)

**13. Sort each eval candidate mechanical vs. conceptual; default to code.** Apply the 10-line rule: expressible as a <10-line Python function → code eval. Bin each mechanical eval into one of four types — structure/format, presence/coverage, tool-call sequencing, threshold. Write all three parts (inputs / check / **reason string**) plus passing + failing example pairs. *(Ch 6)*

**14. Establish a baseline pass rate** per eval on the current production version; **set explicit thresholds in advance, in writing**, scaled to the change size. Verify the eval before trusting the result (on any 0%/unexpected rate, read five reason strings first). Wire the suite into the release workflow to fire on every prompt/model change. *(Ch 6)*

**15. Escalate to LLM judges only for genuinely subjective criteria** (tone/empathy, directness/actionability, factual grounding/memory, semantic completeness/context). Write each judge to the recipe: auditor role, **one binary** question, observable standard, pass + fail + *borderline* examples, "think step-by-step," strict JSON/YAML output. **Narrow scope** (one criterion per judge); **reference-free first**, reference-based once you have ground truth. Run judges only *after* code evals pass. *(Ch 7)*

### Phase 5 — Build and govern the dataset

**16. Seed (pre-launch):** 20–50 traces from running the agent over AI-PRD intents/edge cases + vibe-check golden outputs; structure every row with the five fields (input, output, reference, per-criterion label, notes). **Expand toward 100** via trace analysis, authoring traces for missed failure modes. **Balance for difficulty, not frequency**; use the UIG to find uncovered cells. *(Ch 8)*

**17. Split 10/30/60 (train/dev/test) with no overlap;** one owner guards the test set, another iterates the judge prompt on dev only (contamination defense). Grow from production via the 5-step pipeline (sample → review → label per criterion → bucket → refresh train), combining random + failure-signal + outlier + stratified sampling; keep the queue to 10–20/week. Refresh on cadence (weekly review, 2–4-week full analysis, sample-before-stable after every major change, incorporate EAP data immediately). Version and govern (timestamp every add/remove/relabel; archive don't delete). *(Ch 8)*

### Phase 6 — Calibrate the judges (the trust check)

**18. Calibrate each judge against human labels.** Pull 50–100 representative traces incl. hard/borderline; a domain expert labels each against the *exact* judge criterion. Split dev (~⅓)/test (~⅔); quarantine test. Run the judge on dev, logging verdict + reasoning + human label. Build the confusion matrix; compute **TPR** and **TNR** (expect low TNR first run — 20–40% is normal). **Read every disagreement**, categorize into the four patterns, make **one targeted change at a time** (3–4 near-miss examples is the highest-leverage fix for low TNR; +15–25 pts). Validate on test **once**; if within 5 points of dev, document TPR/TNR/prompt/date as baseline and choose the deployment tier (hard gate / monitoring-only / split the judge). Schedule **quarterly recalibration** on 50 fresh production traces. If 5 iterations can't push both past 80%, run the ceiling checks → structured human review. *(Ch 9)*

### Phase 7 — Iterate to improve quality (evals measure; experiments improve)

**19. Diagnose:** pull the new version's eval results; compare per-eval against the production baseline on the *same* dataset; rank by lowest pass rate; inspect failure distribution and cross-eval correlation; then read 10 specific failing traces + reasoning strings. *(Ch 10)*

**20. Hypothesize and change one thing,** on the cheapest viable lever (**prompt → model → architecture**, in cost order). Re-run the full suite; report per-eval deltas. **Apply the rule:** *ship* (all thresholds met, no >2-pt regression) / *iterate* (target up but something regressed) / *revert* (worse or no measurable impact). For 2–3-pt calls, enlarge the dataset or re-run to rule out noise. *(Ch 10)*

**21. Log the experiment** (hypothesis, change, before/after, decision); if shipped, update the baseline. **Update the AI PRD** (thresholds, trace codes, golden outputs, edge cases) and the **dataset** (new-pattern failures → test cases; resolved traces → regression tests). Re-baseline the whole suite after any architecture change. *(Ch 10)*

### Phase 8 — Monitor production (close the flywheel)

**22. Stand up online monitoring before launch.** Decide sampling (random + stratified + failure-biased mix); set rates (code evals on **100%** of traffic, judges on **1–10%** sized for 50–100 evaluated traces/week); reuse the *same* offline evals against live traces; instrument operational signals (latency P95, error/timeout rates, token usage, cost) onto the same dashboard. Set every alert threshold while calm, with 7-day rolling averages and a written response procedure (owner / first check / escalation) per alert. *(Ch 11)*

**23. Watch the offline↔online gap and diagnose drift.** A small gap is normal. On a drift signal, identify which of three it is and route to its fix: *score divergence* → refresh/rebalance dataset; *new failure modes* → fresh trace analysis + new trace codes/evals; *feedback contradiction* → you're measuring the wrong thing, build new judges. Close the loop: label failing/edited traces, add to the dataset, re-run offline to set a new baseline, ship. Hold a **<10-day detect-to-fix SLA.** *(Ch 11)*

### Phase 9 — Scale to complex agents (when the agent is multi-step)

**24a. Decompose** the agent into routing / individual skills / full-path; instrument component boundaries in the trace; build the cheapest effective eval per component (code for routing/skills/exec-accuracy; judges for full-path). Evaluate tool calls at three levels (selection / parameter extraction / response handling); inject failures to build the recovery suite; add persona simulation last, validated against production. *(Ch 12)*

**24b. Visualize with a failure funnel.** Map specific, independently-diagnosable steps; define a binary criterion per step; run the reference dataset; record entered/passed/step-level pass rate. Find the *earliest* bottleneck, do the leverage math, diagnose the exact transition with the matrix, segment if the aggregate is ambiguous, **fix upstream first**, track over time, report (weekly internal, monthly one-page funnel to stakeholders). *(Ch 13)*

**24c. Vibecode the tooling** that accelerates the human loop: identify your trace-review friction (= the backlog), pick the tool (Lovable/Replit, Claude Code/Cursor, or Jupyter), write a *specific* starter prompt (name fields/format/labeling outputs), build the minimal prototype in 1–2 hours, run a real session, iterate against friction, automate the integrations last. Build the right pattern (Trace Review / Calibration / Dashboard / Collaborative) when its trigger hits. *(Ch 14)*

Then **repeat** — each turn of the flywheel sharpens the rubric, the dataset, the judges, and the agent together. *(Ch 1)*

## The "learn / operate / tools" framing

The same process viewed through three lenses a PM cares about: what you *learn* (the concepts you internalize), how you *operate* (the day-to-day behavior), and what *tools* you reach for.

| Phase | What the PM learns | How the PM operates day-to-day | Tools reached for |
|---|---|---|---|
| **0 — Reframe & prototype** *(Ch 1–2)* | Measure work, not usage; outcomes are a distribution; demo before memo | Stand up a thin prompt+connector; run a vibe check; label ✓/~/✗ | Prototype harness; vibe-check sheet |
| **1 — AI-native PRD** *(Ch 3)* | The capability is free, reliability is the work; rubric > feature list; "I don't know" is a product decision | Write the quality-bar PRD; place the product on the confidence 2×2 | AI-PRD scaffold; golden-output collector; "I don't know" calculator |
| **2 — Trace analysis** *(Ch 4)* | Observe before you score; binary-or-it's-not-a-code; saturation per dimension | Read 30–50 traces free-form; cluster codes; run team-sport labeling to >90% | UIG builder; trace-code clusterer; inter-rater tracker |
| **3 — Triage** *(Ch 5)* | Most failures aren't eval candidates; spec/architecture/generalization | Run each trace code through the 3-question tree; route to prompt/eng/eval | Triage decision tree; eval-candidate scoring sheet |
| **4 — Build evals** *(Ch 6–7)* | Mechanical vs. conceptual; floor not ceiling; binary judges, narrow scope | Write code evals (<10 lines + reason string); write judge prompts to the recipe; set thresholds before results | Code-eval scaffold; judge-draft skill; dataset-run dashboard |
| **5 — Datasets** *(Ch 8)* | Evals are only as good as the data; mirror difficulty not frequency; contamination is subtle | Sample with 4 strategies; label per criterion; split 10/30/60; refresh weekly; run eval-first EAP | Trace sampler; split-dataset tool; UIG-coverage diff; version log |
| **6 — Calibration** *(Ch 9)* | A judge is an opinion; uncalibrated is worse than none; TNR is the hard number | Hand-label, build the matrix, read every disagreement, one change at a time, validate once | Calibrate-judge skill; confusion-matrix calculator; near-miss miner; baseline ledger |
| **7 — Iteration** *(Ch 10)* | Evals measure, experiments improve; one change at a time; cheap levers first | Diagnose → hypothesize → one change → measure per-eval → ship/iterate/revert → log | Experiment log; eval-diff dashboard; diagnose-failure skill; noise-floor calculator |
| **8 — Monitoring** *(Ch 11)* | Shipping isn't the finish line; production is a data generator; alerts need owners | Sample live traffic; watch the gap; diagnose drift; feed surprises back within 10 days | Monitoring setup canvas; drift-triage skill; ticket-to-trace-code aggregator; edit-to-golden harvester |
| **9 — Complex agents** *(Ch 12–14)* | System score = product of parts; fix upstream first; review speed = flywheel speed | Decompose; build funnels; fix the earliest bottleneck; vibecode the review jig | Decomposition canvas; failure-funnel skill; transition-matrix builder; trace-app starter |

## The five rules that survive every phase

If a PM forgets the 24 steps, these five carry the whole process:

1. **Define "good" before you build anything** — and define thresholds *before* you see the results (Ch 3, 6).
2. **Observe real traces before you automate** — the categories you measure must be earned from behavior, not imposed (Ch 4).
3. **Triage before you build; cheap before expensive** — most failures aren't eval candidates, and prompt beats model beats architecture (Ch 5, 10).
4. **The dataset and the calibration are the foundation** — an unrepresentative dataset or an uncalibrated judge makes every number a lie (Ch 8, 9).
5. **Close the loop, forever** — production surprises become test cases; the flywheel only compounds if you keep spinning it (Ch 1, 11).
