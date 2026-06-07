# Chapter 3 — AI-Native PRD Writing: Quality Criteria, Golden Outputs & Eval Rubrics

## In one line
A traditional PRD describes a system someone will *build*; an AI-native PRD describes the *quality bar* a probabilistic system has to meet — and the mechanism for knowing whether it does.

## Why it matters for PMs
For deterministic software, "done" is binary: the feature exists or it doesn't, and a list of user stories is a sufficient spec. For agentic products built on frontier models, the core capability is usually *already present at launch* — it just performs with low reliability. So the PM's spec can no longer be a backlog of features to build; it has to be a definition of what *good* looks like and a plan for hill-climbing toward it.

The evidence the module uses: look at how Claude Code (a terminal-based coding tool, released Feb 2025) evolved over its first 12 months. Five of its first seven releases were *performance improvements* to the agentic-coding capability it already shipped with at launch — not net-new features. The genuinely new functionality (MCP connectors in May; the skills system in Sep/Oct) was the exception, not the rule. If most of your releases will be quality improvements to capabilities you already have, then your PRD's job is to define quality, not to enumerate features.

This is why the skill matters: if a PM hands engineering a feature list, the team has no shared definition of quality to converge on, "great" gets defined by whoever writes the code, and the product drifts. The PM who can specify the quality bar — and prototype well enough to produce concrete examples of it — keeps ownership of what the product *is*.

## Core concepts
- **AI-native PRD** — A spec that describes the bar a probabilistic system has to meet, centered on quality definitions and performance scores. Written *after* initial prototyping, not before.
- **Golden outputs** — Concrete input/output pairs showing both strong ("what great looks like") and weak ("the boundaries and failure modes") examples. They anchor the team's shared understanding of quality. Must include messy cases.
- **Evaluation rubric** — Shared standards that translate product intuition into measurable criteria (accuracy, hallucination rate, latency). At PRD stage it is intentionally vibe-oriented: clarity of *what matters and why* comes before automation of *how it's measured*.
- **Dataset curation strategy** — A plan for capturing and labeling real user-interaction data so the dataset comes to reflect reality rather than the team's original assumptions.
- **The "I don't know" threshold** — A *product decision* about when the agent should decline to answer. The gap most PRDs leave here is what produces hallucinations.
- **Trace analysis** — Reviewing the full record of a single interaction (the user input plus the LLM-generated output) to identify patterns. Covered in depth in Module 4.
- **Performance as the primary release type** — Because V1 already has the core capability, most subsequent releases are quality improvements, not new features.
- **Hill climbing** — The continuous-improvement loop of measuring against the rubric and pushing the score up release over release.

## The mental model — how to think about this
Stop thinking "spec → build." Start thinking "prototype → define quality → measure → hill-climb."

Three shifts make this concrete:

1. **The capability is free; the reliability is the work.** A frontier model can already generate infinite variations of (say) an email draft. The hard product question is no longer "can it draft an email?" but "of these variations, which ones are great, and how do we make great the reliable default?"

2. **You can't spec what you haven't felt.** The PRD comes *after* vibe checks, manual prototyping, and prompt testing — because only by prototyping can the PM generate golden outputs across a diverse set of real inputs and build intuition for the agent's failure modes. A theoretical PRD with no concrete examples gives engineering nothing to anchor on.

3. **Design is implicit in the golden outputs.** The traditional UX/UI spec is replaced by a working prototype, and the quality the design encodes lives in the examples themselves. You show, you don't describe.

## Key frameworks / steps / loops

### Framework 1 — Traditional PRD section → AI-native equivalent
This is the spine of the whole module (it's the `ch2-02-prd-comparison.png` diagram).

| Traditional PRD section | AI-native equivalent | What changes |
|---|---|---|
| Goals & success metrics | **Evaluation rubric** | Moves from engagement metrics (DAU, conversion, retention) to output-quality criteria (% accuracy, hallucination rate, latency in ms) |
| User stories & use cases | **Golden outputs** | Instead of describing what users want to do, you *show* concrete input/output pairs of what great solutions look like |
| Functional requirements | **Prompt logic & tool specification** | Instead of feature/function behaviors: the agent's system instruction, the tool APIs it can call, and the rules for graceful failure |
| UX / UI spec | **Working prototype** | Completely replaced; the design is implicit in the golden outputs |
| (none) | **Edge-case handling** *(new)* | What should the model do when it fails? What do early prototype findings already say about where it fails? |
| Open questions | **Dataset strategy** | Unknowns become "what new datasets are needed to improve the agent?" |

### Framework 2 — The three vital new components
1. **Golden outputs** — strong + weak examples, including messy cases (incomplete inputs, contradictory instructions, ambiguous context), because that's where the quality bar matters most.
2. **Evaluation rubric** — what accuracy means in *your* domain, what tradeoffs are acceptable, and which failures are *never* allowed. Vibe-oriented now; automated later.
3. **Dataset curation strategy** — start as exploration, then capture and label real interactions to discover the variation you didn't anticipate.

### Framework 3 — The "I don't know" decision (a 2×2)
Plot **confidence threshold** against **failure cost** (the `ch2-04-confidence-matrix.png` diagram):
- **Conservative** (high failure cost — legal, medical, financial, compliance): admit uncertainty *early*. The agent declines when (a) relevant info isn't in the top retrieved documents, (b) retrieved sources contradict each other, or (c) the evidence is ambiguous. *"I don't have enough information to answer this accurately"* is a **success state, not a failure.**
- **Permissive** (low failure cost — research, brainstorming, exploration): synthesize and caveat.
- The decision rule: *the right threshold depends on the failure mode you're most afraid of.* A legal assistant that fabricates a case citation is a liability; a brainstorming tool that hedges on every suggestion is useless.

How to *specify* it in the PRD:
- Confidence threshold **per query type**.
- The **exact decline language** ("Your question falls outside what I have reliable information on" beats a bare "I don't know").
- What to surface **instead**: a fallback path, a suggested query reformulation, or an escalation.

How to *measure* it — the "I don't know" rate in production:
- **>30%** → retrieval is failing; users are hitting dead ends.
- **<5%** in a knowledge-bounded system → the agent is filling gaps with fabrications rather than admissions.
- **10–20%** → the healthy target range for most enterprise applications.

### The loop
Prototype / vibe-check → write golden outputs from diverse inputs → write the rubric (vibe-oriented) → ship V1 → review traces → label datasets → tighten the rubric and add examples → release a performance improvement → repeat.

## Visual explainers

**[Visual: Claude Code release timeline]** (described in the Intro transcript, no static asset captured) — A diagram of Claude Code's first 12 months showing that five of its first seven releases were performance improvements to its existing agentic-coding capability, with MCP connectors (May) and the skills system (Sep/Oct) as the rare net-new additions. *Teaching point:* for agentic products the V1 already ships the core capability — so "performance is the primary release type," and the PRD's job is to define and raise quality, not to list features.

**[Visual: ch2-02-prd-comparison.png — "Comparing PRD Approaches"]** — A side-by-side table mapping each traditional PRD section to its AI-native equivalent (goals→rubric, user stories→golden outputs, functional reqs→prompt logic & tools, UX spec→prototype, +edge cases, open questions→dataset strategy). *Teaching point:* this is the single most useful artifact in the module — it lets a PM who already knows how to write a PRD translate, section by section, into the AI-native form. Walk the class down it row by row.

**[Visual: ch2-03-ai-prd-components.png — "Sample AI PRD components"]** — A diagram of the key components of an AI-native PRD, sitting alongside the full 7-section sample PRD for the Support Triage Agent. *Teaching point:* shows the abstract framework and a concrete, complete instance together, so learners see that a "brief but complete" AI PRD is genuinely short — the rigor lives in the golden dataset and the rubric, not in page count.

**[Visual: ch2-04-confidence-matrix.png — Confidence vs. failure-cost matrix]** — A 2×2 of agent response in low-clarity scenarios: confidence threshold against failure cost, with the conservative quadrant ("admit uncertainty early") for high-stakes domains and the permissive quadrant ("synthesize and caveat") for exploratory domains. *Teaching point:* the "I don't know" behavior is a deliberate product decision a PM places on this map — not a model setting engineering picks by default.

## How this connects to: simulation / dataset strategy / synthetic data / actual data
- **Simulation / prototyping** — The PRD is downstream of prototyping. The PM simulates the product by hand (vibe checks, prompt variations) to discover what's possible and to generate the golden outputs that go *into* the PRD. No prototype, no real golden outputs, no credible PRD.
- **Dataset strategy** — Treated as a first-class PRD section that replaces "open questions." It starts as exploration; the explicit acknowledgment is that *early examples are never sufficient*. The plan is to capture and label cases as real users interact, so the dataset migrates from assumption-shaped to reality-shaped.
- **Synthetic data** — Implicit in the sample PRD's iteration: when the prototype showed the model struggled with sarcasm, the team *authored* 5 sarcastic complaint examples and added them to the golden dataset for few-shot learning. That's deliberately constructed (synthetic) data used to patch a known failure mode — a bridge until real labeled sarcastic tickets accumulate.
- **Actual / production data** — The "I don't know" rate is measured *in production* on real traffic, and drift monitoring runs a weekly manual audit on 5% of AI-tagged tickets. Real-world data is the source of both the continuous rubric tightening and the growth of the golden dataset. (Module 8 covers managing these datasets and continuously updating the PRD; Module 4 covers reading the traces that feed it.)

## Working with ML / eng teams
- **Don't outsource quality definition.** The module is explicit: teams that let ML engineers exclusively own trace review, rubric writing, and dataset labeling "discover quickly that product taste matters and development is slowed down." An engineer can *implement* a rubric; they can't *define what great means for your users.* That is the PM's (and designer's) job.
- **Hand engineering an anchored spec, not a theory.** The PRD that eng starts from should already contain golden output examples drawn from diverse inputs — concrete, not theoretical.
- **Specify the tool surface precisely.** The sample PRD's Tool Specification lists each tool with name, action, input parameter, and purpose (e.g., `User_Lookup` queries the internal DB by `user_email` to check VIP/Enterprise status; `CRM_Write` writes the final classification back to Salesforce/HubSpot by `ticket_id, tag`). This is where the PM defines what the agent is allowed to *do*, not just what it should *say*.
- **Make graceful-failure rules explicit.** Functional requirements become prompt logic + tools + rules for what happens when the agent can't fulfill the request — engineering needs the failure behavior spec'd, not assumed.
- **Share the work, keep the taste.** PMs spend real time on prompt variations, trace review, rubric iteration, and dataset labeling — alongside ML eng, not above or below them.

## Role of design
- **The UX/UI spec is replaced by a working prototype**, and "the design should just be implicit in the golden outputs." Design quality is encoded in the examples of what great output looks like.
- **Design owns "great" alongside the PM.** The module names designers explicitly: defining what *great* means for users is "your job as well" for both PMs and designers — it should not be left to ML engineers.
- Design's contribution shifts from screen layouts to shaping the *output quality* and the *failure/decline experience* (e.g., what a graceful "I don't have enough information" moment looks and feels like to a user).

## Process to follow
1. **Prototype first.** Run vibe checks, manual prototyping, and prompt testing to establish what's possible before writing anything formal.
2. **Generate golden outputs** from a diverse set of inputs — strong and weak, and deliberately include messy cases (incomplete, contradictory, ambiguous).
3. **Write the evaluation rubric**, vibe-oriented: state what accuracy means in your domain, acceptable tradeoffs, and the failures that are never allowed. (Sample targets: categorization accuracy >92%, sentiment precision >85%, latency <2s, hallucination rate 0%.)
4. **Specify prompt logic and tools**: the system instruction, the tool APIs and their parameters, and graceful-failure rules.
5. **Decide and spec the "I don't know" threshold** per query type — decline language + fallback/reformulation/escalation.
6. **Write the edge-case section** from real prototype findings (see sample: short inputs cause hallucination → add clarification-needed mode; ~20% of tickets are multi-issue → add multi-label instructions; sarcasm fails → add 5 examples).
7. **Add technical constraints** (sample: scrub PII via regex preprocessor before the LLM call; keep cost <$0.01/ticket).
8. **Lay out the dataset curation strategy** for capturing and labeling real interactions.
9. **Ship V1, then hill-climb**: review traces, measure the "I don't know" rate and rubric metrics in production, run drift audits (sample: weekly audit on 5% of tagged tickets), add a user feedback loop ("Is this tag correct? Yes/No"), and treat most subsequent releases as performance improvements.

### The sample AI PRD's 7 sections (reference scaffold)
*Support Ticket Triage (v1.0) — Owner: [Name] | Status: Prototyping | Default Model: Gemini 3 Flash Preview*
1. **Problem & Business Value** — support leads spend ~4 hrs/day manually tagging tickets, lagging specialists; solution is a background agent that classifies tickets in real time by Intent, Sentiment, and Urgency.
2. **Prompt Logic & Dataset** — system instruction (categorize into Technical/Billing/Feature Request; assign sentiment Positive/Neutral/Frustrated/Angry; if Frustrated/Angry, flag for human override regardless of category) + 50 historical tickets with "Gold" labels for few-shot prompting.
3. **Tool Specification** — `User_Lookup`, `Subscription_Check`, `Jira_Search`, `CRM_Write`, each with input param + purpose.
4. **Evaluation Criteria** — the rubric table above. *Course note: standard out-of-the-box evals like LLM tone/helpfulness are NOT primary success metrics for this workflow.*
5. **Edge Cases Handling** — low-confidence fallback (confidence <0.7 → "Needs Human Review"), drift monitoring (weekly 5% audit), user feedback loop.
6. **Prototype & Early Findings** — short-input hallucination, multi-issue tickets, sarcasm — each with the fix.
7. **Technical Constraints** — PII scrubbing, cost ceiling.

## References & sources
- **Source module (Notion meeting note):** "AI-Native PRD Writing: Quality Criteria, Golden Outputs & Eval Rubrics" — https://app.notion.com/p/3775d11649418070baded201ad8ca0db
- **Recommended article:** "How to write a good Agent spec" by **Addy Osmani** (Google) — https://addyosmani.com/blog/good-spec/
- **Worked example:** "Sample AI PRD: Support Ticket Triage (v1.0)" with attached 50-row golden dataset (in the module materials).
- **Forward links within the course:** Module 4 (reading agent traces and clustering failure patterns into codes; knowing when you've seen enough to move to automation) and Module 8 (managing datasets and continuously updating PRDs).
- **Product referenced as evidence:** Claude Code (terminal-based coding tool, released Feb 2025) — release-history example for "performance is the primary release type."
- **Default model named in the sample PRD:** Gemini 3 Flash Preview.
- **Tools/APIs cited in the sample:** Stripe/Billing, Jira, Salesforce/HubSpot (CRM), internal user database.
- **Frameworks introduced:** Traditional→AI-native PRD section mapping; the three vital components (golden outputs / eval rubric / dataset strategy); the confidence-vs-failure-cost 2×2 for "I don't know."
- **Embedded images:** `ch2-02-prd-comparison.png`, `ch2-03-ai-prd-components.png`, `ch2-04-confidence-matrix.png` (plus the Claude Code release-timeline diagram described in narration).

## Skill / template / app ideas
- **`/ai-prd` skill** — Scaffold an AI-native PRD from the 7-section sample: prompts the PM for problem/value, system instruction, tool list, rubric thresholds, "I don't know" policy per query type, edge cases, and dataset plan; refuses to finalize until at least N golden outputs (incl. messy cases) are attached.
- **PRD-translator template** — A two-column doc that puts the traditional PRD section next to its AI-native equivalent, so teams migrating an existing PRD fill the right-hand column.
- **Golden-output collector app** — A lightweight UI to run a prototype prompt across a batch of diverse inputs, tag each output strong/weak, and export the keepers as a golden dataset (with a "messy case" flag).
- **"I don't know" calculator** — Given a domain (failure cost) and query types, recommends conservative vs. permissive posture, drafts decline language, and sets a target "I don't know" rate band (10–20% default; flags <5% and >30%).
- **Rubric-to-eval converter** — Takes the vibe-oriented rubric thresholds and stubs out the automated eval harness (the Module-4/Module-8 bridge).
- **Drift-audit cron** — Samples 5% of production-tagged items weekly into a review queue with the Yes/No feedback loop wired in.

## Teaching notes (for the instructor)
- **Lead with the Claude Code release chart.** It's the most persuasive 60 seconds in the module — it makes "performance is the primary release type" land before any abstraction. If you can recreate the 5-of-7 timeline, do.
- **Anchor on the comparison table, then immediately drop to the sample PRD.** Abstraction → concrete instance is the module's own rhythm; mirror it. Have learners read the full 7-section sample silently for two minutes before you discuss.
- **The counterintuitive line to dwell on:** *"I don't have enough information" is a success state.* Most PMs reflexively treat a non-answer as failure. The 2×2 and the >30% / <5% / 10–20% bands give them a defensible way to set the threshold — make them place a real product of their own on the matrix.
- **Hit the sequencing point hard:** the PRD comes *after* prototyping. This is the most common thing PMs get backwards. Tie it to the practical consequence — without a prototype you can't produce golden outputs, so your PRD is theoretical and engineering can't anchor on it.
- **Name the political point:** don't let ML eng own rubric/trace/labeling exclusively. Frame it as the PM's leverage, not a turf war — engineers *want* a clear definition of great; the PM is the one who can give it.
- **Two good discussion prompts:** (1) "What's the worst failure mode of your product, and does your spec say what the agent does when it doesn't know?" (2) "Translate one section of a PRD you've actually written into its AI-native equivalent."
- **Note the explicit course caveat** in the rubric: out-of-the-box evals like generic tone/helpfulness are *not* primary success metrics for a workflow like triage — push learners to define domain-specific metrics instead of reaching for the defaults.
- **Vocabulary to drill** (from the recap): AI-native PRD, golden outputs, evaluation rubric, dataset curation strategy, trace analysis. Each has a one-line definition in the module — use them verbatim for the glossary.
