# Chapter 12 — Evaluating Complex AI Agents: Architectural Decomposition

## In one line
When a production agent is more than one input/one output — routing, tool calls, intermediate reasoning, multi-step pipelines — stop scoring it as a black box; break it into evaluable components so a headline success rate stops telling you *something* is wrong and starts telling you *what* and *where*.

## Why it matters for PMs
Up to this point the course evaluated the Support Triage Agent: a single-step system — one input, one classification, one response. Most production agents are not this simple. A research agent retrieves documents, synthesizes findings, and writes a report. A customer-service agent routes to specialized sub-agents, calls APIs, and composes a multi-part resolution. An analytics agent reads a natural-language question, generates SQL, executes it, and summarizes the results. Single-turn evals don't scale to these systems, and worse, they actively mislead: a complex agent scoring 55% end-to-end is *not* a "55% agent" — it's typically a system where several components run at 95% and one component runs at 76%, and that one step drags the whole pipeline down. "The agent fails 45% of the time" is not a roadmap. "Routing misclassifies 8%, SQL generation produces invalid queries 24% of the time, summarization misses key findings 6%" is a roadmap. Decomposition is what converts a vague quality complaint into a prioritized backlog the PM can defend in a product review.

## Core concepts

- **Architectural decomposition.** Instead of evaluating the system as a black box, break it into its major components and evaluate each independently to isolate where failures originate. This is the spine of the whole chapter.
- **The three decomposition layers**, each with its own eval strategy:
  - **Orchestration & routing** — did the system understand the request and choose the right path?
  - **Individual skills** — did each component do its job when given reasonable inputs?
  - **Full-path outcomes** — did the user's goal actually get accomplished?
- **Two architectures, two eval strategies:**
  - **Multi-agent systems (parallel orchestration)** — a lead orchestrator delegates to specialized sub-agents working *simultaneously* (e.g. a support orchestrator dispatching billing, technical, and sentiment sub-agents in parallel, then synthesizing). Evaluate routing correctness, each sub-agent in isolation, and orchestrator synthesis independently.
  - **Multi-step pipelines (sequential processing)** — each step's output is the next step's input; one failure breaks the chain. Prioritize cascading-failure analysis and fix the earliest failing step.
- **Tool-call evaluation at three levels** (most teams collapse these into one pass/fail — a mistake): tool **selection**, parameter **extraction**, response **handling**.
- **Cascading failure** — an error in an early step propagates downstream, making one root cause look like many independent failures. Count *primary* failures only.
- **Error recovery / self-correction** — whether the agent detects, diagnoses, and corrects failures, rather than freezing or hallucinating. This is what separates demo agents from production agents.
- **Simulation-based evaluation** — an LLM playing a realistic user (goal, persona, constraints) over 8–12 turns, to test what static input/output pairs can't.
- **Benchmark accuracy ≠ production accuracy** — academic text-to-SQL benchmarks report 85–90% execution accuracy; real-world enterprise accuracy drops sharply once you add complex schemas, multiple SQL dialects, and multi-step reasoning.

## The mental model — how to think about this
Picture the agent not as a single score but as a **chain (or tree) of components**, each with its own quality rate, where the system-level number is the *product* of the parts. A pipeline at 0.95 × 0.95 × 0.76 × 0.95 doesn't average to "pretty good" — it multiplies down to the low 60s, and the 0.76 step is the lever. The black-box success rate hides the multiplication; decomposition exposes it.

Two structural shapes change where you look. In a **parallel** (multi-agent) system the failure could be in routing, in any one sub-agent, or in the synthesis that recombines them — so you instrument those three seams separately. In a **sequential** (pipeline) system, position matters enormously: a 3% failure in Step 1 isn't a 3% problem, because every downstream step then runs *correctly on wrong inputs* and silently inherits the error. That's why the highest-leverage eval almost always sits at the *top* of the pipeline, not at the visibly-broken step near the bottom. The instinct to "fix where the error appears" is the trap; the discipline is to **work backwards to where the error originated.**

## Key frameworks / steps / loops

**1. Three layers to decompose into (and how to eval each):**

| Layer | Question | Eval approach |
|---|---|---|
| Orchestration & routing | Did it interpret intent, extract parameters, choose a valid capability (not hallucinate one)? | Code-based eval on routing decisions; labeled dataset of intents → expected routes; pass/fail. Cheapest to build, highest leverage. |
| Individual skills | Can each capability do its job on reasonable inputs? Where does it break (edge cases, scale, ambiguity, missing context)? | Dedicated eval suite *per skill* (code eval + LLM judge), scoped to that skill's quality criteria; run *without* the routing layer in the loop so failures attribute to the skill, not the system. |
| Full-path outcomes | Did it accomplish the goal (effectiveness)? Did it take a reasonable path (efficiency)? | End-to-end success criteria per task type. Code evals for clear-answer tasks; reference-based LLM judges or human review for open-ended ones. Efficiency = step count, total latency, token cost. |

**2. Tool-call evaluation — three failure modes per call** (per Anthropic's research on agent evaluation):

- **A. Tool selection** (a classification problem). Labeled dataset of requests → expected tool; pass/fail on expected-vs-actual tool. "What was our revenue last quarter?" → `query_database`, not `search_documents`. **>95% selection accuracy is table stakes** — below that the system "feels random." Add a code eval that checks the selected tool *exists in the toolkit* to catch **hallucinated tools** early.
- **B. Parameter extraction** — three failure modes: **missing** (omits the time range, returns all-time data), **incorrect** (`region = "APAC"` when the DB uses `"Asia Pacific"`), **malformed** (date filter `"2025-Q3"` when the API expects `"2025-07-01"`). Code evals for exact-match params (dates, IDs, enums); LLM judges for fuzzy params with multiple acceptable formulations. **This is where PMs add unique value** — their understanding of defaults and commonly-misused parameters (e.g. an agent silently defaulting granularity to "daily" because the prompt didn't stress temporal granularity).
- **C. Response handling** — three patterns: **faithful interpretation** (no hallucinated/dropped/misrepresented results — best judged by an LLM comparing raw tool output vs. agent response), **error handling** (does it surface errors/empty results or paper over them?), **multi-tool synthesis** (combining several tool outputs correctly). The dangerous failure: an empty DB result reported as *"There were no signups in Q3"* instead of *"The query returned no results, which may indicate a data issue."*

**3. Cascading-failure diagnostics — work backwards:**
- Find the **last step that was correct**, then examine the step immediately after it — that boundary is where the cascade started.
- Distinguish **primary** failures (root cause) from **secondary** failures (downstream noise). When sizing problems, count primary only: 10 Step-1 failures that ripple through Steps 3–7 is **10 failures, not 50**.
- Map last-successful-step against first-failing-step across all traces in a **transition failure matrix** to rank highest-leverage targets (detailed visualization tooling comes in the next module).

**4. Error-recovery evaluation — three scored dimensions:**
- **Error detection** (binary) — does the agent recognize something went wrong, rather than treating a tool error as a valid response?
- **Diagnostic reasoning** (LLM judge on the trace) — does it correctly identify *why* it failed (wrong column vs. DB down vs. ambiguous question)?
- **Adaptive retry** (code eval on final output) — does the corrective action address the root cause and ultimately succeed? Retrying with identical parameters is not recovery; neither is giving up after one try.
- **Track recovery rate alongside first-attempt accuracy.** If first-attempt is 82% and recovery lifts success to 93%, recovery adds 11 points of real value; if it only adds 2, the agent is retrying without changing its approach — a different problem.
- An agent that detects and diagnoses but fails to recover is still better than one that never notices — scoring should reflect that gradient.

**5. Practical layering loop — start simple, add layers (do NOT build all four at once):**
1. Define **binary success criteria** for routing, each skill, and the full path.
2. Build **code evals for routing and skill-level checks** first (cheapest, fastest).
3. Add **LLM judges for full-path quality** once component evals are stable.
4. Add **simulation** for multi-turn / long-horizon testing once you have a component + full-path baseline to compare against.
- **Decision guide:** routing failures dominant → invest in routing evals; routing fine but a skill underperforms → isolate the bottleneck skill and apply the iteration loop (from module 10); components fine but composed system fails → invest in full-path + simulation evals (integration and context management are the problem).

## Visual explainers

- **[Visual: Black box vs. decomposition]** — `ch11-01-black-box-vs-decom.jpg`. Contrasts a single opaque box with one headline success rate against the same system broken into labeled, separately-scored components. Teaching point: a 55% black box hides the fact that the real story is several 95% parts plus one 76% bottleneck — only decomposition shows you which knob to turn.
- **[Visual: Two architectures]** — `ch11-02-two-architectures.jpg`. Side-by-side of the multi-agent (parallel: orchestrator → simultaneous sub-agents → synthesis) and the multi-step pipeline (sequential: each step feeds the next). Teaching point: the architecture dictates the eval strategy — parallel systems need routing/sub-agent/synthesis seams instrumented; pipelines need cascading-failure analysis weighted toward early steps.
- **[Visual: Backward diagnostic]** — `ch11-04-backward-diagnosti.jpg`. A long trace with failures lighting up at Steps 3, 5, and 7, annotated to show the true origin at Step 1. Teaching point: read traces backwards — find the last correct step, inspect the next one; count the one primary failure, not the five secondary ones.
- **[Visual: Simulation design]** — `ch11-05-simulation-design.jpg`. An LLM-driven user persona (goal, communication style, frustration trigger) conversing with the agent across multiple branching turns. Teaching point: static datasets are single input/output rows; real users take 8–12 turns of follow-ups, corrections, and course changes — simulation is how you test that surface.
- **[Visual: Layered eval investment]** — `ch11-06-layered-eval-inves.jpg`. A staged build-out: binary criteria → code evals (routing + skills) → LLM judges (full path) → simulation (multi-turn). Teaching point: layers are added in cost/leverage order; you invest in the layer where failures are most visible and work outward, not all at once.

(Note: the source deck numbers its assets `ch11-*` even though this is course module 12 — the asset prefix lags the chapter number by one; no `ch11-03` asset exists in the source.)

## How this connects to: simulation / dataset strategy / synthetic data / actual data

- **Actual data** is the validation ground truth and the iteration fuel. The case study runs the eval suite on **~200 production traces** to locate hotspots, and the chapter's hardest rule is to *always validate simulation against real production traces*: if simulation shows 90% goal completion but production monitoring shows 70%, the personas are wrong and must be updated.
- **Dataset strategy** is per-component and intent-driven. Routing needs a labeled set of intents → expected routes. Tool selection needs requests → expected tools. Parameter extraction needs schemas with normal, edge, and adversarial cases. Skill evals need known-good intent/parameter pairs. The text-to-SQL intent-parsing eval calls for **50–100 labeled test cases** spanning simple, multi-dimensional, ambiguous, and implicit-time-range queries.
- **Synthetic data** appears as **deliberate failure injection**: you *manufacture* tool errors, unexpected schemas, partial results, and timeouts to build the recovery eval suite — because real traces rarely contain enough clean examples of every failure type to test recovery systematically.
- **Simulation** covers what static data structurally cannot: multi-turn branching, recovery-from-mistakes, and context management over long conversations. Its known bias — simulated users are more cooperative, predictable, and less creative than real ones — is exactly why it's framed as a *regression/coverage* tool, not a standalone multi-turn verdict.
- The loop: actual traces locate the bottleneck → labeled datasets and injected failures pin down the component → simulation stress-tests multi-turn behavior → results are checked back against production. This module is the complex-agent application of the AI Flywheel introduced in Chapter 1.

## Working with ML / eng teams

- **Decomposition is a shared engineering decision, not just a measurement convention.** The PM needs the eng team to expose component boundaries in the **trace** (parsed intent, selected tool, extracted parameters, raw tool output, each pipeline step's I/O) so each layer is independently observable. If the trace only shows input and final output, no decomposition is possible — instrument first.
- **Hand off the cheap, deterministic checks to code; reserve judgment for judges.** Routing, schema mapping, tool selection, parameter exact-match, SQL syntactic validity, and **execution accuracy against a test database** are all code evals engineers can own and run in CI. The PM owns the labeled ground truth and the quality bar; eng owns the harness.
- **Execution accuracy is the gold standard** for SQL generation — a query can be syntactically valid and semantically wrong. As the **BIRD benchmark** demonstrated, the gap between syntax checks and execution accuracy is where most real-world failures hide. Push eng to run queries against a test DB with known data, not just parse them.
- **Translate the transition matrix into a prioritized backlog.** When the matrix shows Schema Mapping → SQL Generation as ~half of all failures, that's the engineering work order: prompt fixes for JOIN patterns, a schema-aware validation layer, and (later) a model upgrade with error recovery — applied via the iteration loop from module 10.
- **Recovery is an eng design conversation, not just a metric.** Detect/diagnose/retry behavior depends on how errors are surfaced to the model and whether the harness allows a retry budget — PM defines expected recovery behavior per failure type; eng implements the retry/clarification mechanics.

## Role of design
- **Surfacing uncertainty and failure honestly is a design problem.** The chapter's signature failure mode — an empty query confidently reported as *"There were no signups in Q3"* — is as much UX as model behavior. Design owns how the agent communicates "no results / possible data issue," how it asks a clarifying question on ambiguity ("show me performance" → *which* metric?), and how a retry or fallback is shown to the user without eroding trust.
- **Efficiency is felt, not just measured.** Step count, latency, and cost are eval metrics, but the user *experiences* them as waiting and as the agent "thinking out loud." Design decides how much of the multi-step path to expose so a reasonable, slightly-longer path reads as thoroughness rather than floundering.
- **Clarifying-question patterns** are a recovery affordance: the "ask rather than guess" behavior only helps if the interface invites and frames that question well.

## Process to follow
The chapter's worked example — a **text-to-SQL analytics agent** serving product teams ("What was our weekly signup rate for enterprise accounts in Q1?") — is the canonical end-to-end process:

1. **Decompose the pipeline into its distinct evaluation targets.** For text-to-SQL, six steps: **intent parsing** (metric, dimensions, time range, filters) → **schema mapping** (intent → correct tables/columns; `signups` → `events.signup_completed`, not `events.account_created`) → **SQL generation** (valid JOINs, WHERE, GROUP BY, aggregation) → **SQL execution** (capture errors, timeouts, empty results) → **result interpretation** (raw rows → meaningful answer) → **summary generation** (clear, actionable NL response that flags caveats).
2. **Build a layered eval per step with the cheapest effective method:**
   - Intent parsing → **code eval** vs. labeled ground truth (no LLM judge needed); 50–100 cases across simple/multi-dimensional/ambiguous/implicit-time queries.
   - Schema mapping → **code eval** on correct table/column selection (catches "intent right, wrong table" — e.g. `signup_started` vs. `signup_completed`).
   - SQL generation → **code eval + execution test**: syntactic validity *and* execution accuracy against a test DB (execution accuracy is the gold standard).
   - SQL execution → **code eval** tracking error rate, timeout rate, and recovery success rate separately.
   - Result interpretation → **LLM judge** on numerical accuracy, completeness, and honesty (caveat-flagging).
   - Summary generation → **LLM judge** on whether the final response answers the question, is clear/concise/actionable, and meets the AI-PRD quality bar (this is the full-path eval).
3. **Visualize failures and iterate.** Run the suite on **~200 production traces**, build the **transition failure matrix** and **failure funnel** (next module) to find concentration — e.g. Schema Mapping → SQL Generation as the dominant ~50% hotspot — then apply the **iteration loop** (module 10) to that step.
4. **Add recovery and simulation layers** once components are stable: inject failures to build the recovery suite; run persona-driven simulations for multi-turn behavior; validate both against real production traces.

## References & sources
- **Anthropic — research on agent evaluation.** Cited as the source for the three tool-call failure modes (wrong tool / wrong parameters / mishandled response). [Source: course text.]
- **LangChain — *2026 State of AI Agents* report.** 57% of organizations now have agents in production; quality is cited as the top deployment barrier by 32% of respondents. Used to motivate recovery as a core quality dimension.
- **BIRD benchmark** (text-to-SQL). Cited to show the gap between syntactic validity and execution accuracy — where most real-world SQL failures hide.
- **Academic text-to-SQL benchmarks** — generally report **85–90% execution accuracy**; contrasted with lower real-world enterprise accuracy ("benchmark accuracy is not production accuracy").
- **Cross-references within this course:**
  - Modules 6 & 7 — code-eval + LLM-judge methodology (reused per skill).
  - Module 10 — the iteration loop (applied to the highest-leverage failing step).
  - The next module — **failure funnels** and the **transition failure matrix** for visualizing multi-step eval results.
  - Earlier modules (5–10) — the **Support Triage Agent** single-step running example that this chapter contrasts against.
- **Source lesson structure (Reforge / Docebo SCORM course "Evaluating Complex Agents"):** 1. Intro · 2. Three Places Quality Breaks in Agentic Systems · 3. Cascading Failures in Long Agentic Traces · 4. Simulation: Testing What Static Inputs Can't · 5. Recap and Further Learning.
- **Image assets:** `ch11-01-black-box-vs-decom.jpg`, `ch11-02-two-architectures.jpg`, `ch11-04-backward-diagnosti.jpg`, `ch11-05-simulation-design.jpg`, `ch11-06-layered-eval-inves.jpg`.

## Skill / template / app ideas
- **Decomposition canvas (template).** A one-pager that forces a PM to draw their agent's components, label each as parallel-orchestration or sequential-pipeline, and assign each component an eval type (code / LLM judge / human) before any eval is written.
- **Tool-call eval generator (skill).** Given a toolkit spec, auto-scaffold the three-level eval set per tool: selection labeled dataset, parameter schema with normal/edge/adversarial cases, and response-handling judge prompts (incl. a "hallucinated tool" existence check).
- **Transition-matrix builder (app/skill).** Ingest a batch of traces, compute last-correct-step × first-failing-step, and render the matrix + failure funnel — turning raw traces into a ranked fix list (pairs with the next module).
- **Recovery eval injector (skill).** A failure-injection harness that wraps tools to emit errors, empty results, schema changes, and timeouts on demand, with a scoring rubric for detect / diagnose / recover.
- **Persona simulator (skill).** Define user personas (goal, style, frustration trigger), run 8–12-turn simulated conversations against an agent, and score goal achievement, step count, interruption handling, and context retention — with a built-in reminder to reconcile against production traces.
- **AI-PRD quality-bar snippet (template).** A reusable section defining the summary-generation quality bar that the full-path LLM judge scores against.

## Teaching notes (for the instructor)
- **Lead with the multiplication, not the layers.** Open by asking the room what a "55% agent" means. Most will say "fails about half the time." Reveal it's usually 0.95 × 0.95 × 0.76 × 0.95 — the point lands harder as arithmetic than as a definition.
- **The single most counterintuitive idea is "fix upstream first."** Spend real time on the cascading-failure example (research agent reads "recent" as "last year" instead of "last week"; every later step works *correctly on bad inputs*; the summary eval may even *pass* because the prose is good). The kicker — only the end-to-end eval catches it — is the moment that justifies the whole decomposition method. Drill the "count 10 failures, not 50" rule; PMs consistently over-count secondary failures and mis-prioritize.
- **Make the empty-result failure visceral.** "There were no signups in Q3" vs. "the query returned no results, which may indicate a data issue" is the line most likely to change behavior on Monday — it's concrete, high-stakes, and obviously a PM/design call, not just a model bug.
- **Anchor on the text-to-SQL case study throughout.** It's the connective tissue: use it to instantiate every abstract layer (intent parsing = code eval; result interpretation = judge; etc.) so PMs leave with a concrete template rather than a taxonomy.
- **Hammer "benchmark ≠ production."** Many PMs cite vendor benchmark numbers in reviews; the 85–90% academic vs. lower-enterprise gap (BIRD) is the antidote.
- **Common misconceptions to pre-empt:** (1) "more eval layers = better" — no, start where failures are most visible and add outward; (2) "simulation can replace production monitoring" — no, it's cooperative and predictable, always reconcile to traces; (3) "high first-attempt accuracy is the goal" — no, an 80%-with-recovery agent beats a 90%-that-freezes agent.
- **Exercise:** hand teams one long trace with failures at Steps 3/5/7 and have them work backwards to identify the single primary failure and the transition where the cascade began. Then have them decide which eval layer to invest in using the decision guide.
- **Watch the source artifacts:** the deck's asset prefixes are `ch11-*` and skip `ch11-03`; don't promise a visual that doesn't exist. The fetched transcript also tails off into unrelated radio-chatter audio artifacts — ignore everything after the recap; it is not course content.
