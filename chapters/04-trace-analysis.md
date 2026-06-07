# Chapter 4 — Principles of Trace Analysis

## In one line
This chapter teaches PMs a lightweight, repeatable workflow for reading agent *traces* — sourcing diverse inputs, reviewing outputs free-form, and clustering recurring patterns into binary "trace codes" — so quality becomes concrete and observable before anyone builds a dashboard or an automated scorer.

## Why it matters for PMs
Trace analysis is the AI equivalent of UX research: instead of interviews and session replays, you study real inputs and outputs to understand where the system succeeds and fails. New features, unexpected behavior, and user complaints all surface *first* in real traces. The chapter's central warning is aimed squarely at the PM instinct to look rigorous: most teams skip this step and jump straight to dashboards, benchmarks, and automated scoring — and end up with metrics that look credible but don't reflect what users actually experience. Reading traces is where failure modes get *named* and where reference examples are *created*; without it, every downstream rubric, dataset, and automated eval is built on a guess. This is also where the PM's "product taste" gets converted into trusted, repeatable standards the whole team can align on.

## Core concepts

- **Trace.** The complete record of everything that happened inside a single AI request — *all* user inputs, *all* model outputs (including intermediate steps), and metadata such as timestamps, token counts, and model versions. When you analyze a trace you review not just the final output but the full sequence of work the system performed.
- **Turns and sessions.** Traces can be single- or multi-turn; each turn is fresh external input to the LLM. Recommendation: record all the AI-vs-user back-and-forth in a single session as one trace.
- **One trace per agent task.** A workflow that feels continuous to the user can produce multiple traces under the hood — *each distinct agent task is its own trace*. In an AI slide tool (e.g., Gamma), "outline → slides generation" is one trace and "rewrite this slide through iterations" is a separate group of traces, because they're collaborative work with different parts of the app.
- **Span.** A sub-step inside a trace. A RAG (retrieval-augmented generation) trace from a customer support agent asking about a return policy shows spans for: the user input query, the retrieval step (agent fetches relevant content), and the final response span with token/latency metadata.
- **Trace code.** A named cluster of similar success or failure patterns — a recurring behavior worth tracking. A strong trace code has: a short concrete name, a one-sentence definition, clear **Yes/No** criteria, and 2–3 representative examples. Codes must be **binary** — if two reviewers can't agree whether something passes, the code isn't ready for automated labeling.
- **Three signal types in a trace review:** *hard performance failures* (hallucinated facts, missed user constraints, tool-invocation failures); *soft quality issues* (tone off, technically correct but unhelpful, missed next-step suggestion); and *product differentiators* / emergent behavior (good clarifying questions, a uniquely useful output format).
- **User Input Grid (UIG).** A structured matrix of query dimensions that mirrors production diversity — the antidote to "just ask an LLM for test queries," which produces generic inputs that miss critical edge cases.
- **Saturation.** The stopping rule: ~10 consecutive diverse traces yield no new trace codes and existing codes keep repeating. Saturation is *per dimension*.
- **Playing offense.** Trace analysis isn't only defensive error-hunting — you also capture affirmative patterns (immediate-accept outputs, anticipating the next question) to reinforce what's great.

## The mental model — how to think about this
Treat traces the way a UX researcher treats session recordings: raw evidence of what actually happened, reviewed before you have any opinion you're trying to confirm. The discipline is *observe first, judge later*. You earn the right to score, rubric, and automate only after the raw behavior has taught you what the categories should even be. Patterns emerge through repetition, not by over-structuring the first ten traces — so resist formalizing early.

The pipeline runs in one direction: **raw traces → free-form notes → binary trace codes → rubrics, datasets, automation.** Skipping to the right end of that arrow is the cardinal sin; it produces rigorous-looking metrics that measure the wrong thing. The job is to stay in the messy, qualitative left end long enough that the categories you eventually automate are *real* — grounded in observed behavior, agreed on by multiple reviewers, and binary enough that a machine (or another human) can apply them consistently.

## Key frameworks / steps / loops

**The Trace Analysis Workflow (generating codes) — 3 steps**
1. **Source inputs.** Assemble a small but *diverse* set of inputs to run through the system, from: early design partners / internal users; support tickets or example use cases; or synthetic inputs generated with prompts. At this stage perfection doesn't matter — coverage does. You're trying to see range across personas, intents, ambiguity levels, and edge cases. For early products, synthetic inputs are often the fastest way to explore the solution space; the goal isn't realism for its own sake but stress-testing across plausible scenarios.
2. **Review outputs (free-form).** Review traces manually in an intentionally open-ended pass — not scoring, just observing. Take generous notes; write down anything surprising; capture both failures *and* impressive moments. Watch for the three signal types (hard failures, soft quality issues, differentiators). Resist the urge to formalize early.
3. **Cluster into trace codes.** After reviewing **30–50 traces**, repetition sets in and structure emerges. Cluster notes into trace codes (name + one-sentence definition + Yes/No criteria + 2–3 examples). Keep them binary. Over time these codes become the foundation for rubrics, datasets, and automation.

**The User Input Grid (UIG) methodology — 5 steps**
1. **Define 3–5 key dimensions** that create meaningful diversity: ICP (Enterprise/Mid-market/SMB), persona (Engineer/Manager/Executive), user intent, context richness (complete vs. missing info), ambiguity level (clear vs. vague).
2. **Generate realistic examples** (2–3 per dimension) grounded in real-world constraints — e.g., ICP examples: Public SaaS (public financials), Private B2B (limited public info, infer from news/funding), Healthcare (HIPAA constraints, specialized terminology).
3. **Create combinations.** Combine dimensions into a grid — 4 ICPs × 4 personas × 4 JTBDs = 64 combinations — then remove implausible ones (e.g., "Executive researching low-level technical details"), leaving ~15–20 realistic scenarios.
4. **Add real-world constraints:** missing context (no market/geography specified), ambiguous terms ("best" = revenue, growth, or satisfaction?), time sensitivity ("recent" = last month or last year?), conflicting requirements ("comprehensive but concise"), business rules (data-privacy compliance).
5. **Formulate natural-language queries.** Feed each combination to an LLM as structured input and ask for 2–3 query variations, preserving realistic ambiguity and missing context.

**The collaborative labeling loop**
1. **Independent labeling** — 3–4 team members each label the same 20 traces individually.
2. **Comparison meeting** — compare labels, discuss disagreements.
3. **Refinement** — tighten category definitions where people disagreed.
4. **Standardization** — update the rubric, re-label disagreements.
5. **Repeat** until the team reaches **>90% agreement** across all trace codes.

**The saturation stopping rule.** Stop when ~10 consecutive diverse traces add no new codes and existing codes keep repeating — discovery is done, the work shifts to formalization. Track saturation *per quality dimension* (e.g., ~50 traces to saturate "tone" but ~150 for "factual accuracy").

## Visual explainers
- **[Visual: Where trace analysis sits / its role]** — `ch3-01-trace-analysis-role.png`. Positions trace analysis as the bridge from abstract quality goals to concrete insight, the AI equivalent of UX research. Teaching point: this is the step teams skip on the way to dashboards — and skipping it is why their metrics don't match reality.
- **[Visual: What is a trace — RAG JSON trace]** — `ch3-02-what-is-a-trace.png`. A simplified JSON representation of an LLM trace for a customer-support RAG operation (return-policy question), showing the span structure. Teaching point: a trace is a structured, inspectable object made of spans (input → retrieval → final response + metadata), not just a chat log.
- **[Visual: AI slide-tool traces]** — `ch3-03-slide-tool-traces.png`. Shows how one continuous Gamma-style workflow decomposes into separate traces (slide generation vs. slide rewrite). Teaching point: trace boundaries follow *agent tasks*, not the user's perception of a single flow.
- **[Visual: Trace JSON / observability screenshots]** — `Screenshot 2026-03-26 .png` and `Screenshot 2026-03-26 .jpg`. Supporting captures of trace/JSON or tool views accompanying the "What is a trace" lesson. Teaching point: this is the general shape of traces you'll later inspect in real observability tools.
- **[Visual: The trace-analysis workflow]** — `ch3-04-trace-analysis-work.png`. The 3-step source → review → cluster pipeline. Teaching point: codes are an *output* of observation, not an input you impose up front.
- **[Visual: Trace-code signal types]** — `ch3-05-trace-code-types.png`. The three signal categories: hard performance failures, soft quality issues, and product differentiators. Teaching point: a good review captures wins and emergent strengths, not only errors.
- **[Visual: The UIG methodology]** — `ch3-06-uig-methodology.png`. The 5-step grid-building process (dimensions → examples → combinations → constraints → queries). Teaching point: structured combinatorics beats "generate test queries" for surfacing edge cases.
- **[Visual: UIG prompt example]** — `ch3-07-uig-prompt-example.png`. A worked example turning a structured combination into natural-language queries for the market-research agent (e.g., *"Who are the leading CRM platforms by market share…"*). Teaching point: deliberately bake in ambiguity ("leading") and missing context (geography) so traces stress the system realistically.
- **[Visual: Legal-agent UIG]** — `ch3-08-legal-agent-uig.png`. A second worked UIG for a legal contract analyzer (contract type × user role × intent × context completeness). Teaching point: the same grid method generalizes across domains; the dimensions change, the method doesn't.
- **[Visual: Trace analysis as a team sport]** — `ch3-09-trace-analysis-role.png`. The cross-functional collaboration view (PM / Engineer / Designer / SME each catching different failure modes). Teaching point: convergence to a shared rubric (>90% agreement) is how subjective taste becomes a repeatable standard.

## How this connects to: simulation / dataset strategy / synthetic data / actual data
- **Actual data** is the primary fuel: real traces from design partners, internal users, and support tickets are what you observe in the free-form review pass. Trace analysis *on real behavior* is what reveals the gap between what you assumed users do and what they actually do.
- **Synthetic data** is explicitly endorsed for early-stage products — synthetic inputs generated with prompts are "often the fastest way to explore the solution space." The goal is stress-testing across plausible scenarios, not realism for its own sake.
- **Simulation / dataset strategy** is the UIG: rather than hoping a sample is diverse, you *engineer* diversity by combining dimensions, pruning implausible cells, and adding real-world constraints — then have an LLM generate the natural-language queries. This is a deliberate coverage strategy (range across ICP × persona × intent × ambiguity), not volume for its own sake.
- **Flow into the rest of the eval system:** sourced/synthetic inputs → traces → free-form notes → binary trace codes → these codes "become the foundation for rubrics, datasets, and automation." Trace codes are the seed of the reference datasets and the LLM-as-judge rubrics that later chapters automate. Saturation tells you when the dataset has enough coverage *per dimension* to stop collecting and start formalizing.

## Working with ML / eng teams
- **Engineers reveal a distinct failure class.** In the cross-functional review, engineers focus on *fragility in tool execution and architectural issues* — the failure modes PMs and designers tend to miss (e.g., a tool-invocation failure buried in an intermediate span).
- **Traces are the shared artifact.** Because a trace captures intermediate steps, tool calls, tokens, and latency, it's the common ground where PM and eng can both reason about *what the system actually did*. Hard performance failures (tool failures, missed constraints) often need eng to diagnose root cause once the PM has named the pattern.
- **Binary codes are the handoff contract.** Codes that reach >90% inter-rater agreement are what make automated labeling (and eventually eng-owned eval pipelines and observability tooling) trustworthy. If reviewers can't agree, don't hand it to automation. The JSON/observability-tool framing signals that codes will later be applied at scale in eng-owned tooling — so the PM's job is to make them unambiguous enough to survive that automation.

## Role of design
Design is an explicit, named participant in trace analysis. **Designers surface UX issues and formatting problems** that other roles overlook — output structure, readability, and presentation failures that don't register as "hard failures" but degrade the experience. Several trace-code examples are inherently design-adjacent: "tone feels off," "missed an opportunity to propose next steps," and "consistently finds a unique format for the output" (a *positive* differentiator). Trace analysis is therefore one of the clearest places design contributes directly to AI quality measurement, not just to the interface around it.

## Process to follow
1. **Source a diverse input set.** Pull from design partners, internal users, support tickets, and example use cases; for early products, generate synthetic inputs. Prioritize coverage (personas, intents, ambiguity, edge cases) over polish.
2. **Engineer diversity with a UIG.** Define 3–5 dimensions → 2–3 grounded examples each → combine into a grid → prune implausible cells → add real-world constraints → have an LLM write 2–3 natural-language query variations per cell.
3. **Review free-form.** Read traces manually without scoring. Take generous notes; capture failures *and* wins; watch for hard failures, soft quality issues, and differentiators. Don't formalize in the first ~10 traces.
4. **Cluster into trace codes** after 30–50 traces. Give each a name, one-sentence definition, Yes/No criteria, and 2–3 examples. Keep them binary.
5. **Make it a team sport.** Have 3–4 colleagues independently label the same 20 traces; meet to compare; refine definitions; standardize the rubric; repeat until >90% agreement across codes.
6. **Stop at saturation.** When ~10 consecutive diverse traces add no new codes, move from discovery to formalization — tracking saturation per quality dimension.
7. **Play offense too.** Maintain affirmative codes for immediate-accept outputs, next-question anticipation, and follow-up-reducing responses, so the team reinforces great behavior, not just eliminates bad behavior.

## References & sources
- **Course:** Reforge-hosted module delivered via Docebo/SCORM. **"Chapter 3: Principles of Trace Analysis."** Lessons: (1) Intro, (2) What is a Trace, (3) The Trace Analysis Workflow: Generating Codes, (4) Sourcing a Diverse Dataset: the User Input Grid, (5) Collaboration: Make Trace Analysis a Team Sport, (6) Recap and Further Learning.
- **Worked examples used in the module:**
  - *AI slide tool* (Gamma named) — illustrating one workflow → multiple traces (generation vs. rewrite).
  - *Customer support agent* — RAG trace with input / retrieval / response spans (return-policy question).
  - *Market research agent* — trace codes (unsupported claims, over-generalization, missed ambiguity, strong synthesis) and a full UIG worked example; references **G2** reviews and **Gartner** reports.
  - *Legal contract analyzer* — second UIG worked example (employment agreements, NDAs, vendor contracts; in-house counsel / paralegals / executives).
- **Frameworks / terms introduced:** Trace; span; turn/session; trace code; the 3-step trace-analysis workflow; the three signal types (hard performance failures, soft quality issues, product differentiators); the **User Input Grid (UIG)** 5-step methodology; the collaborative labeling loop (>90% agreement); the **saturation rate** (per-dimension stopping rule); "playing offense" (affirmative pattern capture).
- **Domain constraints referenced:** HIPAA (healthcare ICP), data-privacy regulations (business-rule constraints), California litigation exposure (legal-agent example).
- **Connection to prior chapter:** trace analysis is "the new source of truth" phase of the AI Flywheel (Chapter 1) and the explicit precursor to building reference datasets and automated evals in later chapters.

## Skill / template / app ideas
- **`/trace-code-clusterer`** — paste free-form review notes from 30–50 traces; returns proposed binary trace codes (name + definition + Yes/No criteria + 2–3 example pointers).
- **`/uig-build`** — guided User Input Grid generator: prompt for 3–5 dimensions, generate grounded examples, build and prune the combination grid, inject real-world constraints, and emit 2–3 natural-language query variations per cell.
- **Trace-code template** — a one-page card schema (name, one-sentence definition, Yes/No criteria, 2–3 examples) that doubles as the seed for a later eval rubric.
- **Inter-rater agreement tracker** — a sheet that takes N reviewers' Yes/No labels on the same 20 traces, computes per-code agreement, and flags codes below 90% for refinement.
- **Saturation dashboard** — logs new-code discovery per dimension and signals when a dimension has gone ~10 traces with no new codes (discovery → formalization).
- **`/offense-spotter`** — a review pass that specifically tags affirmative patterns (immediate-accept, next-question anticipation, follow-up-reducing) to feed a "what's great" backlog.
- **Free-form review workspace** — a lightweight trace viewer with a notes pane that intentionally hides any scoring UI during the first pass to enforce "observe, don't judge."

## Teaching notes (for the instructor)
**Emphasize:**
- The cardinal rule: **observe before you score.** The whole chapter is a defense of staying qualitative long enough that your eventual categories are real. The pitfall (jumping to dashboards/automated scoring) is the most important thing to make stick.
- **Binary or it's not a code.** The >90%-agreement gate is the litmus test — if two humans can't agree, automation will be worse, not better.
- **Trace boundaries follow agent tasks, not user perception.** The Gamma example is the cleanest way to teach this; have learners decompose a familiar multi-step AI product into traces.
- **Saturation is per dimension.** PMs love a single "how many traces is enough" number — push back; tone saturates fast, factual accuracy slowly.
- **Play offense.** Most teams only code failures; the affirmative-pattern habit is what protects and amplifies product taste.

**Common misconceptions to correct:**
- "A trace is just the chat transcript." — No: it includes intermediate steps, tool calls, and metadata (tokens, latency, model version); spans matter.
- "Just ask an LLM to generate test queries." — Produces generic inputs that miss edge cases; the UIG exists precisely to fix this.
- "More traces = better." — Saturation, not volume, is the stopping rule; thousands of traces are unnecessary.
- "Formalize codes early to stay organized." — Premature structure hides patterns; the first ~10 traces are for observing, not categorizing.
- "Trace analysis is QA / an eng task." — It's cross-functional and PM-led; each role (PM/eng/design/SME) catches a different failure class.

**Discussion question / exercise:**
- Pick a live AI feature your team owns. (a) Draw its trace boundaries — how many distinct agent tasks, and where does one trace end and the next begin? (b) Build a 3-dimension UIG, prune to ~10 realistic combinations, and write one natural-language query per cell with deliberate ambiguity. (c) Hand-review 10 of those traces free-form and draft 3 candidate binary trace codes — then have a teammate label the same 10 and measure your agreement.
