# Skills, Templates & Custom Apps to Operationalize Evals

Every chapter ends with a "Skill / template / app ideas" section. This synthesis aggregates and dedupes all of them, groups them by type, and gives each a one-line input → output → user. It closes with a master reference list of every external book, talk, tool, and benchmark cited across all fourteen chapters.

The unifying philosophy (Ch 14): a custom tool is a **disposable jig** built around *your* workflow — friction is the spec. Vibecode the minimum, run a real session, let the slow moments become the backlog. Many of the "apps" below are the same starter scaffold (Ch 14) specialized to a phase.

## (a) Slash-command skills

| Skill | Input → Output → Who uses it | Source |
|---|---|---|
| **`/vibe-check`** | A prompt + sample inputs → 10–30 diverse persona-spanning inputs run and labeled ✓/~/✗ with notes + candidate golden outputs → PM prototyping | Ch 2 |
| **`/trace-sample`** (a.k.a. `/trace-sampler`) | Production traffic + sampling knobs → a stratified sample combining random + failure-signal + outlier + stratified, with per-segment oversampling, ready for labeling → PM/eng | Ch 1, 8 |
| **`/error-mode-coder`** | Sampled traces → clustered, impact-ranked error modes → PM doing trace analysis | Ch 1 |
| **`/trace-code-clusterer`** | Free-form review notes from 30–50 traces → proposed binary trace codes (name + definition + Yes/No + examples) → PM/team after free-form review | Ch 4 |
| **`/uig-build`** | 3–5 dimensions → a pruned User Input Grid with grounded examples, constraints, and 2–3 natural-language queries per cell → PM sourcing diverse inputs | Ch 4 |
| **`/uig-coverage`** | Current dataset + the UIG → a prioritized list of uncovered cells → PM checking dataset gaps | Ch 8 |
| **`/offense-spotter`** | A review pass → traces tagged with affirmative patterns (immediate-accept, next-question anticipation) → PM building a "what's great" backlog | Ch 4 |
| **`/eval-rubric`** | An agent description → a scaffolded application-layer rubric (accuracy, intent match, clarity, speed, acceptability) → PM writing the PRD | Ch 1 |
| **`/ai-prd`** | Problem/value + system instruction + tools + thresholds + "I don't know" policy → a 7-section AI-native PRD; refuses to finalize until N golden outputs (incl. messy) are attached → PM | Ch 3 |
| **`/triage-trace`** (a.k.a. `/code-or-judge`, mechanical-vs-conceptual sorter) | A failing trace + intended prompt → diagnosis (spec / architecture / generalization gap) + recommended action; or, given a requirement, "code vs. judge" with rationale → PM triaging | Ch 5, 6, 7 |
| **`/code-eval-scaffold`** | A plain-language success condition + passing/failing examples → a classified, binned, <10-line Python eval function with reason string + docstring spec → PM → eng | Ch 6 |
| **`/judge-draft`** | A trace category + example traces → a full judge prompt to the recipe; flags reference-free vs. reference-based → PM/design | Ch 7 |
| **`/dataset-row`** | A schema → a scaffolded reference-dataset row with the five fields + a slot per criterion → PM/labeler | Ch 8 |
| **`/split-dataset`** | A labeled dataset → a no-overlap 10/30/60 train/dev/test split + contamination-check report → PM | Ch 8 |
| **`/contamination-lint`** | A judge prompt's few-shot examples + the test set → flags any leak → test-set owner | Ch 8 |
| **`/dataset-refresh`** | Scheduled → a weekly digest of outliers + failure-signal traces, 10–20 queued for review → PM | Ch 8 |
| **`/calibrate-judge`** | Traces + human labels + judge prompt → confusion matrix, TPR/TNR, every disagreement with reasoning, and which of the four patterns each is → PM | Ch 9 |
| **`/experiment-log`** | A change + before/after eval results → an appended structured log entry; auto-flags no-impact experiments as revert candidates → PM/eng | Ch 10 |
| **`/diagnose-failure`** | 10 failing traces + reasoning strings → classification (spec/architecture/generalization) + recommended lever (cheap-first) → PM | Ch 10 |
| **`/drift-triage`** | Offline vs. online numbers + recent feedback → which of the three drift signals + the matching fix path → PM monitoring production | Ch 11 |
| **`/failure-funnel`** | Pipeline steps + a results CSV → step-level & cumulative pass rates, flagged bottleneck, improvement math, and a one-page stakeholder narrative → PM | Ch 13 |
| **`/trace-app-starter`** | A trace schema description → a maximally specific vibecoding prompt pre-wired with the four core features → PM building a review tool | Ch 14 |

## (b) Reusable templates / docs

| Template | Input → Output → Who uses it | Source |
|---|---|---|
| **Agent Success Rate template** | Thumbs feedback + actions (download/accept) + semantic frustration signals → one composite score with an explicit "unknown" bucket → PM defining the north star | Ch 1 |
| **AI-PRD scaffold (7-section)** + **PRD-translator** | A traditional PRD → its AI-native equivalent section by section (goals→rubric, stories→golden outputs, etc.) → PM migrating an existing spec | Ch 3 |
| **Golden-dataset / golden-output template** | Inputs → a table (input · golden labels · is-edge-case · source) that doubles as few-shot examples and offline reference set → PM/labeler | Ch 1, 2, 3 |
| **Trace-code card template** | A pattern → a one-page card (name · definition · Yes/No criteria · 2–3 examples) that seeds a later rubric → PM/team | Ch 4 |
| **Inter-rater agreement tracker** | N reviewers' Yes/No labels on the same 20 traces → per-code agreement, codes below 90% flagged → PM running team-sport labeling | Ch 4 |
| **Saturation dashboard** | New-code discovery per dimension → a signal when a dimension has gone ~10 traces with no new codes → PM | Ch 4 |
| **Eval-candidate scoring template** | Each trace code → gap type, eval-worthy?, method (code/judge), pass/fail rule, owner, stage threshold → PM triaging | Ch 5 |
| **Eval-suite spec template** + **release-gate checklist** | Per eval → property, type, check logic, passing/failing example, baseline, committed threshold, gate y/n; blocks if a threshold was edited after results → PM (threshold-before-results discipline) | Ch 6 |
| **Judge-prompt template** + **"is this judge-shaped?" decision card** | A criterion → the six recipe sections + a borderline-examples table; the 10-line + teachability tests as a one-screen checklist → PM/design | Ch 7 |
| **Eval-first EAP kit (3-week playbook)** | A feature → week-1 screen-share script, week-2 query+label sheet (acceptable/needs-edits/unacceptable), week-3 fix-and-retest tracker, deliverable scorecard → PM running an EAP | Ch 8 |
| **Dataset version log** + **governance one-pager** | Each change → timestamped add/remove/relabel + reason + version; fill-in policy for who-adds/who-relabels/who-owns-test → PM governing the dataset | Ch 8 |
| **Calibration baseline ledger** | Per judge → criterion, dev/test TPR/TNR, final prompt, date, deployment tier, next recalibration date → PM tracking drift | Ch 9 |
| **Ceiling-check checklist** | A stuck judge → a 3-signal triage deciding prompt-problem vs. real ceiling → PM before burning more iterations | Ch 9 |
| **Eval-diff dashboard template** + **ship/iterate/revert gate** + **noise-floor calculator** | Per-eval before/after deltas + dataset size + thresholds → baseline-on-same-dataset comparison, >2-pt regressions in red, signal-vs-noise verdict, recommended decision → PM iterating | Ch 10 |
| **AI-PRD sync checklist** | After each cycle → prompts to update thresholds/trace codes/golden outputs/edge cases and move resolved traces to the regression set → PM | Ch 10 |
| **Monitoring Setup Canvas** | Before launch → sampling strategy & rates, the 6 alert thresholds with rolling-average windows, a response-procedure row per alert → PM (decide-while-calm discipline) | Ch 11 |
| **Funnel spreadsheet/Notion template** | Per step → entered, passed, step-level + cumulative pass rate, failures contributed, highlighted bottleneck, "if fixed to peer level" projection → PM | Ch 13 |
| **Decomposition canvas** | An agent → its components labeled parallel/sequential, each assigned an eval type (code/judge/human) → PM before writing any complex-agent eval | Ch 12 |
| **AI-PRD quality-bar snippet** | — → a reusable section defining the summary-generation bar the full-path judge scores against → PM | Ch 12 |
| **Trace-app scaffold template** + **rubric → UI generator** | A trace schema + rubric → a parameterized starter (rendering slot, Pass/Fail+notes+trace-code dropdown, N/P/Y/F/D keymap, progress counter, CSV writer) with UI provably matching the rubric → PM | Ch 14 |
| **Demo-before-Memo PRD template** | A prototype → a PRD scaffold whose first sections are Prototype link / Vibe-check findings / Expectations for the AI → PM (forces prototype-first sequencing) | Ch 2 |

## (c) Small custom apps / tools

| App | Input → Output → Who uses it | Source |
|---|---|---|
| **Offline-eval harness** | A model/prompt version + reference dataset → auto-run vs. baseline, per-metric deltas, "ship / investigate" verdict (the "can I ship the new model today?" button) → PM/eng | Ch 1, 2 |
| **Dataset-run dashboard** | Pass/fail + reason strings per row → pass rate vs. baseline, failure distribution by input attribute, cross-eval correlation heatmap → PM/eng reading aggregate eval results | Ch 6, 7 |
| **Drift dashboard / eval-drift monitor** | Offline eval score trend + support-ticket-theme volume → flags divergence (offline up, tickets up) as suspected drift → PM | Ch 2, 5 |
| **Feedback-signal converter / edit-to-golden harvester / ticket-to-trace-code aggregator** | Support tickets / output comments / SME notes / heavy-edit sessions → (query, corrected-output) dataset rows; clusters tickets and fires at the "5 = trace code" threshold → PM closing the loop | Ch 5, 11 |
| **Confusion-matrix calculator (static app)** + **near-miss miner** | TP/FP/FN/TN or a labeled CSV → TPR, TNR, trace-level agreement, deployment-tier recommendation; ranks false positives by surface-plausibility to propose near-miss examples → PM calibrating | Ch 9 |
| **Recalibration cron** | Quarterly → pulls 50 fresh production traces, re-runs the judge, rebuilds the matrix, flags drift vs. baseline → PM (coding-agent automated) | Ch 9 |
| **Drift-audit cron** | Weekly → samples 5% of production-tagged items into a review queue with the Yes/No feedback loop → PM | Ch 3 |
| **Composite North Star calculator** + **sample-size advisor** + **<10-day drift-to-fix tracker** | Thumbs-down + edit + retry + ticket rates → one tunable satisfaction index; weekly traffic + target sample → recommended judge % and cost; timestamps detection→ship and flags SLA breaches → PM monitoring | Ch 11 |
| **Transition-matrix builder** | A batch of traces (each tagged last-successful + first-failing step) → the matrix grid with hot cells ranked as targets → PM/eng diagnosing complex agents | Ch 12, 13 |
| **Segmented-funnel view** + **funnel-over-time tracker** | Results + a segment tag → one funnel per segment; appended runs plotted over iterations, auto-flagging regressions and bottleneck shifts → PM | Ch 13 |
| **Tool-call eval generator** | A toolkit spec → the three-level eval set per tool (selection dataset, parameter schema with normal/edge/adversarial cases, response-handling judge, hallucinated-tool existence check) → PM/eng | Ch 12 |
| **Recovery eval injector** | Tools → a failure-injection harness emitting errors/empty-results/schema-changes/timeouts, with a detect/diagnose/recover rubric → PM/eng testing recovery | Ch 12 |
| **Persona simulator** | Personas (goal, style, frustration trigger) → 8–12-turn simulated conversations scored on goal achievement, step count, interruption handling, context retention (with a reconcile-to-production reminder) → PM | Ch 12 |
| **The four vibecoded trace-app patterns** | Traces (+ context, + judge outputs, + multiple reviewers) → **Trace Review** (fast labeling), **Calibration** (trace+human+judge side-by-side + override), **Dashboard** (pass-rate charts, funnel viz, drill-down), **Collaborative** (independent labeling + inter-rater stats) → PM, built when each trigger hits | Ch 14 |
| **API-glue prompt helper** + **friction-log → backlog skill** | An observability/CRM/dataset API doc → the integration prompt (+ a debugging prompt for the error); "what was slow" notes → an ordered iteration backlog → PM building/extending the trace app | Ch 14 |

## Top 5 worth building first

Prioritized by leverage across the most phases and by how directly they unblock the flywheel:

1. **The vibecoded Trace Review app (Ch 14).** Highest leverage of all — review speed sets the speed of the *entire* eval flywheel (error analysis, calibration, dataset growth all depend on it). The case study cut review from 3 min → 45 sec/trace and tripled weekly throughput in 6 hours of build. Build this first; everything else feeds it or is fed by it.
2. **The offline-eval harness / dataset-run dashboard (Ch 1, 2, 6, 7).** The "can I ship the new model today?" button — auto-runs evals vs. baseline and returns per-metric deltas with a ship/investigate verdict. This is the artifact that converts opinion into measurement and collapses model rollout from weeks to 24–48 hours.
3. **The AI-PRD scaffold + golden-output collector (Ch 3, 2).** Forces demo-before-memo and refuses to finalize without golden outputs (incl. messy cases). Gets the *definition of good* right at the source, which every downstream eval inherits.
4. **The calibrate-judge skill + confusion-matrix calculator (Ch 9).** Without calibration, judges are vanity metrics — "an uncalibrated judge is worse than no judge." This is the trust check that makes the whole automated layer defensible in a launch review; coding agents now make the grind cheap.
5. **The Monitoring Setup Canvas + drift-triage (Ch 11).** Closes the loop. Forces sampling rates, alert thresholds, and response procedures to be decided while calm (before launch), and routes each drift signal to its correct fix — turning production surprise into dataset fuel within a <10-day SLA.

## Master reference list (external sources cited across all chapters, deduped)

### Articles & blog posts
- **Calibre Labs — "Building an AI Product Flywheel"** — the source of the AI Flywheel concept used throughout. https://blog.calibrelabs.ai/p/building-an-ai-product-flywheel *(Ch 1)*
- **LangChain — "In software, the code documents the app; in AI, the traces do"** — the role of traces. https://blog.langchain.com/in-software-the-code-documents-the-app-in-ai-the-traces-do/ *(Ch 1)*
- **Anthropic — "Demystifying evals for AI agents."** https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents *(Ch 2)*
- **Hamel Husain — "Your AI agent needs Evals."** https://hamel.dev/blog/posts/evals/ *(Ch 2)*
- **Addy Osmani (Google) — "How to write a good Agent spec."** https://addyosmani.com/blog/good-spec/ *(Ch 3)*
- **Anthropic — research on agent evaluation** (the three tool-call failure modes: wrong tool / wrong parameters / mishandled response). *(Ch 12; cited via course text, no URL given)*

### Talks / video
- **Bryan Bischof — "Failure is a Funnel"** — transition matrices and funnel visualization. https://youtu.be/R_HnI9oTv3c *(Ch 13)*
- **Notion AI team's ~10x acceleration via systematic evals** (3→30 issues/day; new models to prod in <24h; 50%+ premium adoption) — referenced video: https://youtu.be/6YdPI9YbjbI *(Ch 2)*

### Benchmarks & evaluation orgs
- **METR** — independent agent/model evals. https://metr.org/ *(Ch 1)*
- **GDP-Val (OpenAI).** https://openai.com/index/gdpval/ *(Ch 1)*
- **Terminal-Bench.** https://www.tbench.ai/ *(Ch 1)*
- **BIRD benchmark** (text-to-SQL) — the gap between syntactic validity and execution accuracy. *(Ch 12; no URL given)*
- **Academic text-to-SQL benchmarks** — generally 85–90% execution accuracy; "benchmark accuracy ≠ production accuracy." *(Ch 12)*

### Reports
- **LangChain — *2026 State of AI Agents* report** — 57% of orgs have agents in production; 32% cite quality as the top deployment barrier. *(Ch 12; no URL given)*

### Eval / observability tools named
- **Braintrust** — 3P eval tool used in the course to demo eval workflows; cited as shipping its agentic interface once evals crossed 60% with Opus 4.5. *(Ch 5; also named as a generic tool to escape in Ch 14)*
- **LangSmith / Langsmith** — generic observability platform; its REST API is the live-trace-pull integration in the Ch 14 case study. *(Ch 11, 14)*
- **Arize** — generic observability platform (the "what to escape" set). *(Ch 14)*

### AI coding tools named (for vibecoding trace apps)
- **Lovable**, **Replit** — full web apps from natural-language description (no-code PMs). *(Ch 14)*
- **Claude Code**, **Cursor** — more control, API integrations (some technical comfort). *(Ch 14)*
- **Jupyter Notebooks** — data-heavy review workflows. *(Ch 14)*

### Products / systems referenced as evidence
- **Claude Code** (terminal coding tool, released Feb 2025) — the "performance is the primary release type" timeline (5 of first 7 releases were perf improvements; MCP connectors May, skills system Sep/Oct). *(Ch 3)*
- **Notion**, **Figma** — cited as exemplars of 24–48h model/prompt rollout. *(Ch 2, 5)*
- **Gamma** (AI slide tool) — illustrates one workflow → multiple traces. *(Ch 4)*
- **Git** (or a dataset-management tool with timestamps) — dataset versioning. *(Ch 8)*
- **G2** reviews, **Gartner** reports — data sources in the market-research-agent UIG example. *(Ch 4)*
- **Gemini 3 Flash Preview** — default model named in the sample AI PRD. *(Ch 3)*
- **Opus 4.5 / Opus 4.6** — models referenced in the Braintrust threshold and "competitor ships on launch day" examples. *(Ch 5)*

### Domain/regulatory constraints referenced
- **HIPAA** (healthcare ICP), data-privacy regulations, California litigation exposure (legal-agent example). *(Ch 4)*

### Concepts cited from the broader eval canon (no specific external source)
Confusion matrix; sensitivity/specificity (TPR/TNR); inter-annotator agreement; stratified sampling; overfitting; dev/test validation; RAG (Retrieval-Augmented Generation); GREP. *(Ch 9, 6)*

> Note on coverage: Chapters 6, 7, 9, 10, and 11 cited **no external books, papers, or named individuals** — their references are internal to the course. The course itself is a Reforge-hosted curriculum delivered via Docebo/SCORM; per-chapter Notion source pages are listed in each chapter's References section.
