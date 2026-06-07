# Chapter 14 — Vibecoding Custom Trace Analysis Apps

## In one line
Use AI coding tools (Lovable, Replit, Claude Code, Cursor, Jupyter) to build a throwaway-cheap, product-specific trace review app in hours instead of weeks — because teams with custom annotation tools iterate roughly 10x faster than teams stuck on generic observability platforms.

## Why it matters for PMs
Trace review is the bottleneck in every eval program. Error analysis, judge calibration, and dataset growth all depend on a human reading traces and labeling them — and the speed of that loop sets the speed of the whole eval flywheel. Generic observability tools (Langsmith, Arize, Braintrust) make that human slow: they show raw JSON, they can't pull in business context, and they can't enforce your rubric. A custom tool collapses review time from ~3 minutes to ~45 seconds per trace. Across hundreds of review sessions that gap compounds into days of reclaimed time and a dataset that grows fast enough to keep evals honest.

The unlock for PMs specifically: you no longer need to file a ticket and wait on eng to get the review tool you need. With AI coding tools, the person who knows the rubric and feels the friction (the PM) is also the person who can build and iterate the tool — in the same afternoon, against a real review session. The tool becomes an extension of the eval workflow rather than a generic container you bend yourself around.

## Core concepts
- **Generic vs. custom trace tooling.** Generic tools nail the basics — trace logging, metric tracking, prompt playgrounds. They fail at four specific things: (1) rendering your specific output format, (2) showing business context that lives outside the trace, (3) supporting your specific labeling workflow, (4) integrating with your internal systems.
- **Domain-specific rendering.** Show the output the way the user actually sees it: an email rendered as an email, SQL with syntax highlighting plus execution results, slide content as a visual preview. Rendering is the difference between scanning a trace in 10 seconds and spending 2 minutes reconstructing what the agent produced.
- **Context-in-one-view.** The reviewer should never need to open a second tool. Pull account tier, conversation history, and related support tickets in from the CRM and put them next to the trace.
- **Workflow-encoded labeling.** The UI enforces the rubric: if every Fail requires a reason, the Fail button is blocked until a note is entered; if the taxonomy has exactly 8 trace codes, the dropdown lists exactly those 8.
- **Speed as a first-class feature.** Keyboard shortcuts, progress indicators, and skip-reviewed navigation keep the reviewer in flow. Speed is not polish — it is the metric that determines how much of your trace volume you can actually look at.
- **Vibecoding.** Describing the app you want in natural language to an AI coding tool and getting a working app back — then iterating against real usage rather than spec'ing it all up front.
- **Specificity in the build prompt.** "Build me a trace reviewer" produces something generic and useless. Naming your fields, your file format, and your labeling outputs produces something usable on the first try.

## The mental model — how to think about this
Think of the trace review app as **a disposable, self-built jig**, not a product. A jig is a cheap fixture a craftsman builds to hold a specific piece of work — it exists to make one repeated task fast and consistent, and you throw it away or rebuild it when the work changes. Three implications:

1. **It is built around your workflow, not the vendor's.** The whole value is that it encodes *your* rubric, *your* taxonomy, *your* rendering, *your* integrations. Anything generic enough to be a product is, by definition, not doing this job.
2. **Friction is the spec.** You don't design the feature set up front. You run a real review session, notice what's slow or confusing, and the friction points *become* the backlog. The tool grows toward the work.
3. **Cheap to build means cheap to change.** Because it took 1–2 hours, you can afford to rebuild it when your eval criteria evolve. The economics that used to force you onto generic tools (eng is expensive, custom is slow) have flipped.

The deeper shift: the bottleneck was never "we don't have a trace viewer." It was "the trace viewer we have doesn't fit our work." AI coding tools make fit cheap.

## Key frameworks / steps / loops

### The four limits of generic observability (what to escape)
1. Rendering your specific output format (raw string vs. formatted email / highlighted SQL)
2. Showing business context (CRM data — account tier, ticket history, escalation history — not in the trace)
3. Supporting your specific labeling workflow (can't enforce your rubric or trace-code taxonomy)
4. Integrating with internal systems (dataset management, observability, CRM — all product-specific)

### The four core features (what to build)
1. **Intelligent trace rendering** — display output in product format; collapse metadata / intermediate reasoning / system tokens into expandable sections; highlight user input, agent output, tool calls, and failure signals. Make the reviewer's job obvious: "read the question, read the response, decide if it's good." Everything else is context-on-demand, not visual noise.
2. **Labeling interface** — binary Pass/Fail buttons; required notes field; trace-code dropdown enforcing your exact taxonomy (from the trace-code chapter); "Add to dataset" button routing to dev or test bucket. The UI enforces the rubric (block Fail without a reason; list exactly your N trace codes).
3. **Navigation & filtering** — filter by trace code, eval result, date range, user segment, product feature; sort by eval score, latency, response length, confidence; search by keyword or semantic similarity; progress indicator ("Trace 23 of 50, 46% complete") so sessions don't feel endless.
4. **Keyboard shortcuts** — N = next, P = previous, Y = pass, F = fail, D = add to dataset. Saves 15+ minutes per 50-trace session vs. clicking; 4+ hours per team member per quarter.

### The vibecoding workflow (how to build) — 4 steps
- **Step 1 — Choose your tool**
  - *Lovable / Replit* — best for PMs with no coding experience; generate full web apps from a natural-language description.
  - *Claude Code / Cursor* — better for PMs with some technical comfort; more control, better for custom API integrations and custom logic.
  - *Jupyter Notebooks* — best for data-heavy workflows; build widgets/small UIs in the notebook; great for combining trace review with data analysis (e.g., plotting failure distributions while reviewing).
- **Step 2 — Start with a minimal prototype (1–2 hrs)** — load traces from CSV/JSON, show one at a time with basic formatting, Pass/Fail buttons that write labels to a file, next/previous nav. Goal is a working tool you can use today, not a polished app. **Be specific in the prompt** (name fields, file format, labeling outputs).
- **Step 3 — Iterate based on usage** — run one real session of 20–30 traces; note what's slow/missing/confusing; friction points become the backlog; add filtering, keyboard shortcuts, dropdowns, routing incrementally, each solving a pain you actually felt.
- **Step 4 — Connect to data sources for automation** — pull traces from the observability platform via API (kills the manual export step, lets you review traces as they arrive); pull user context from CRM/database; push labels back to dataset management (dev/test bucket, GitHub, or observability platform). Start manual to polish the workflow, then automate. API integration is where AI coding tools especially excel — describe the API and the data, let the tool write the integration code.

### The starter prompt (the load-bearing artifact)
> Build an app that loads traces from a JSON file where each trace has fields: user input, agent output, tool calls, and trace ID. Display one trace at a time with user input at top, agent output below it formatted as markdown, and tool calls in a collapsible section. Add Pass and Fail buttons that write the trace ID and label to a CSV file. Add Next and Previous buttons to navigate, and show a progress counter ("Trace 12 of 50").

This produces a working app on the first try in Claude Code or Cursor. The specificity is the whole point.

## Visual explainers

**[Visual: Generic vs. Custom trace view]** (`ch13-01-generic-vs-custom-.jpg`) — Side-by-side contrast: on one side a generic observability viewer showing a raw JSON trace; on the other a custom tool showing the same trace as a formatted email with the customer's account tier and conversation history alongside, plus Pass/Fail buttons mapped to the annotation rubric. *Teaching point:* the same underlying trace is either a 2-minute reconstruction job or a 10-second scan — rendering and context are what make the difference, and that is exactly what generic tools can't give you.

**[Visual: The four capabilities custom tools enable]** (`ch13-02-four-capabilities.png`) — A four-panel layout of the capabilities a custom tool unlocks: domain-specific rendering, contextual information in one view, workflow-specific navigation, and speed (keyboard shortcuts + progress indicators). *Teaching point:* these four map directly against the four limits of generic tools — each custom capability exists to defeat a specific generic failure, so the list is a "what to build" checklist, not abstract benefits.

**[Visual: Trace rendering / labeling layout]** (`ch13-03-trace-rendering-la.jpg`) — A wireframe-style layout of the trace review screen: user input at the top, agent output rendered in product format below, tool calls collapsed into an expandable section, and the labeling controls (Pass/Fail, notes, trace-code dropdown, Add to dataset) positioned for fast access. *Teaching point:* the layout itself encodes the reviewer's decision flow top-to-bottom — read input, read output, decide, label — so good information hierarchy is what produces the speed, not just the keyboard shortcuts.

## How this connects to: simulation / dataset strategy / synthetic data / actual data
- **Dataset strategy.** The "Add to dataset" button with dev/test routing is the mechanism by which review feeds your dataset. A fast review tool means the dataset grows faster — the case study team's dataset grew faster precisely because they reviewed 3x more traces per week. The tool is the on-ramp from raw production traffic into a curated, bucketed dataset.
- **Actual (production) data.** Step 4 connects the tool to the observability platform API so you review *live production traces as they arrive* rather than stale CSV exports. The case study's Day-4 LangSmith integration pulled live production traces — this is how the tool stays anchored to real-world behavior instead of a frozen snapshot.
- **Golden dataset / reference labels.** The case study's Day-2 "show reference" toggle displays the golden label next to the agent's output with diffs highlighted — connecting trace review directly to the golden dataset so the reviewer calibrates against ground truth in-line.
- **Simulation / synthetic data.** Not directly covered in this module. The link is structural: whatever the *source* of traces (real production, simulated runs, or synthetic generations), the review/labeling/routing tool is the same — so a custom trace app is a reusable surface over any of those data origins. (Source: not addressed in module; relationship inferred from the loader-agnostic CSV/JSON design.)
- **Calibration loop.** The "calibration app" pattern (below) puts trace + human label + judge verdict side by side, which is how human labels and LLM-judge outputs get reconciled. Faster review = the calibration loop runs in hours instead of days.

## Working with ML / eng teams
- **The PM can now own the review tool.** The headline shift is that the rubric-owner builds the tool, removing a dependency on eng for internal tooling. This is collaboration-changing, not collaboration-eliminating.
- **Eng/ML still own the production integrations' contracts.** Pulling from the observability platform and pushing to dataset management touches systems eng owns — auth tokens, API formats, rate limits, schema. In the case study the LangSmith API integration needed one round of debugging because the auth token format was wrong. Treat eng as the source of truth for API specs and credentials; the AI coding tool writes the glue.
- **Use the tool as a shared spec.** A working trace app is a far better artifact for aligning with ML on the rubric and taxonomy than a doc — they can review traces in it and disagree concretely.
- **Trace-code taxonomy is a joint asset.** The dropdown enforces the taxonomy defined upstream (the trace-code/error-analysis chapter), which is typically co-owned by PM + ML. Keep the tool's dropdown in sync with the canonical taxonomy.

## Role of design
- **Information hierarchy is the design job.** The core design decision is what to surface vs. collapse: user input / agent output / tool calls / failure signals are highlighted; metadata, intermediate reasoning, and system tokens collapse into expandable sections. The screen should make the reviewer's decision obvious.
- **Rendering fidelity matters and needs hand-tuning.** In the case study the only manual adjustments after generation were CSS tweaks to make the email rendering look realistic. Domain-specific rendering is where a little design polish has outsized payoff — a trace that *looks* like the real output is faster to judge.
- **Diff highlighting as a design pattern.** The "show reference" toggle highlights differences from the golden label in yellow — a deliberate visual-design choice that makes disagreement scannable.
- **Flow-state design.** Progress indicators ("X of N, % complete"), keyboard-first interaction, and skip-reviewed navigation are UX choices in service of keeping the reviewer in flow. Design here is measured in seconds-per-trace, not aesthetics.

## Process to follow
1. **Identify your trace-review friction points first** — they are your feature backlog before you write a line of prompt.
2. **Pick the tool to match your comfort and workflow** — Lovable/Replit (no code), Claude Code/Cursor (some technical comfort, API-heavy), Jupyter (data-heavy).
3. **Write a specific starter prompt** naming your fields, file format, and labeling outputs; build the minimal prototype in 1–2 hours.
4. **Run a real session of 20–30 traces** in your own tool. Don't optimize first — feel the friction.
5. **Iterate against the friction**: add filtering, keyboard shortcuts, trace-code dropdown, dataset routing, progress indicators — one pain point at a time.
6. **Automate last**: wire in observability-platform API for live traces, CRM for context, dataset management for label push-back. Expect one round of API/auth debugging; feed the tool the error message to fix it.
7. **Pick the pattern** that matches the job (Trace Review / Calibration / Dashboard / Collaborative) — see below — and build the variant when its trigger condition hits.

### Four patterns from the field
| Pattern | Best for | Core features | Build it when |
|---|---|---|---|
| **Trace Review app** | Daily/weekly error-analysis sessions; optimized for speed & coverage | Trace rendering, Pass/Fail labels, trace-code assignment, keyboard nav, progress tracking | As soon as you do regular trace reviews (after the first analysis cycle); if reviewing >10 traces/session |
| **Calibration app** | Judge-calibration sessions | Side-by-side trace + human label + judge verdict + reasoning string; disagreement filter; override button to relabel when judge is right and human is wrong | When you start calibrating LLM judges and find yourself manually comparing spreadsheets of human labels vs. judge outputs |
| **Dashboard app** | Stakeholder communication & team alignment (pattern-level, not trace-level) | Pass-rate charts, failure-funnel viz, trend lines, drill-down from aggregate to individual trace | When you regularly report eval results to leadership or other teams |
| **Collaborative labeling app** | Cross-functional trace-analysis sessions | Independent labeling per reviewer, inter-rater agreement stats, disagreement highlighting/discussion, rubric reference panel | When multiple people label (PM + domain expert + engineer) and you need inter-rater agreement |

### Case study reference timeline (Triage Review app, built in Lovable)
- **Starting prompt (<2 hrs):** JSON with ticket text, agent category, sentiment, urgency, ticket ID; email-style rendering; Pass/Fail; trace-code dropdown (correct triage / wrong category / wrong sentiment / wrong urgency / edge case / ambiguous input); next-previous nav; progress counter; CSV export. Only manual fixes: CSS for email rendering + CSV export path. Loaded a 50-ticket golden dataset.
- **Day 2 (after 30 traces):** added "show reference" toggle (golden label, diffs in yellow) + category filter dropdown. → **3 min → 90 sec per trace.**
- **Day 4:** added LangSmith API integration for live production traces + "flag for discussion" button + progress indicators (reviewed / remaining / current pass rate). One round of auth-token debugging. → **90 sec → 45 sec per trace; keyboard shortcuts the biggest gain.**
- **Total investment:** 6 hours across 3 sessions.
- **Return:** team reviews 50 traces/week instead of 15 (3x); dataset grows faster; calibration loop runs in hours not days; error-analysis sessions cut from a half-day to 45 minutes.

## References & sources
- **Course module:** "Vibecoding Custom Trace Analysis Apps" (Reforge-hosted SCORM course; this is module/chapter content, internally labeled "ch13" in asset filenames). Lessons: (1) Intro, (2) How to Build It: The Vibecoding Workflow, (3) Case Study: Building a Triage Review App, (4) Recap and Further Learning.
- **AI coding tools named:** Lovable, Replit, Claude Code, Cursor, Jupyter Notebooks.
- **Generic observability tools named (the "what to escape" set):** Langsmith / LangSmith, Arize, Braintrust.
- **Integration named in case study:** LangSmith REST API (live production trace pull).
- **Cross-references to other modules:** trace-code taxonomy chapter ("Chapter 3" / "module 4" in the source — taxonomy + trace codes); judge-calibration module ("Module 9"); error-analysis cycle; cross-functional labeling from earlier modules.
- **Field-research claim:** teams with custom annotation tools iterate ~10x faster (cited as "per field research"; no specific study named in the module).
- **Images (3):** `ch13-01-generic-vs-custom-.jpg`, `ch13-02-four-capabilities.png`, `ch13-03-trace-rendering-la.jpg` (Reforge SCORM asset CDN).
- **No books, named authors, or external articles** were cited in this module.

## Skill / template / app ideas
- **`/trace-app-starter` skill** — takes a description of your trace schema (fields, file format, labeling outputs) and emits a ready-to-paste, maximally specific vibecoding prompt for Lovable/Cursor/Claude Code, pre-wired with the four core features.
- **Trace-app scaffold template** — a parameterized starter repo (single-file HTML or Jupyter widget) with rendering slot, Pass/Fail + notes + trace-code dropdown, keyboard map (N/P/Y/F/D), progress counter, CSV writer — fill in fields and rubric.
- **Rubric → UI generator** — input the annotation rubric and trace-code taxonomy; output the dropdown options and the enforce-notes-on-Fail validation logic so the UI provably matches the rubric.
- **Calibration-app variant generator** — given human-label and judge-output schemas, emit the side-by-side + disagreement-filter + override app (pattern 2).
- **Friction-log → backlog skill** — capture "what was slow" notes during a review session and turn them into an ordered iteration backlog for the next vibecoding pass.
- **API-glue prompt helper** — paste an observability/CRM/dataset-management API doc; get the integration prompt (and a debugging prompt that takes the error message) for Step 4.

## Teaching notes (for the instructor)
- **Lead with the 10x and the 3min→45sec numbers.** They are the hook; everything else is the mechanism. Anchor the whole module on "review speed sets eval speed."
- **Note the source's own labeling quirk:** asset filenames say "ch13" while this is taught as Chapter 14 in our sequence — don't let students get confused by the on-screen numbering. Also flag two transcript typos: the auto-transcript says "yes equals fail / F yes equals pass" — the correct mapping is **Y = Pass, F = Fail** (the written lesson is authoritative).
- **Make the specificity point physically.** Show "build me a trace reviewer" vs. the full named-fields prompt, ideally by running both live — the difference is the single most actionable lesson and lands best as a demo.
- **Teach "friction is the spec" as the anti-pattern correction.** PMs instinctively want to spec the whole tool up front; the method is the opposite — build the minimum, feel the pain, then build. The case study's Day-2/Day-4 iterations exist *because* of real review sessions, not planning.
- **Use the four-patterns table as a decision aid, not a build list.** Students should leave knowing which one pattern to build first (almost always Trace Review) and the trigger that tells them when to build the next.
- **Connect forward and backward:** backward to the trace-code/taxonomy and error-analysis chapters (the dropdown enforces that taxonomy); forward to judge calibration (the calibration-app pattern). The tool is the connective tissue of the eval program, so teach it as infrastructure, not a one-off.
- **Pre-empt the eng-dependency objection.** Some PMs will say "this is eng's job." The case-study auth-token debug shows the honest seam: PM owns the tool and the rubric; eng owns the API contracts and credentials. Frame it as collaboration that moves the boundary, not removes it.
- **Suggested live exercise:** have each student write a specific starter prompt for *their own* product's trace schema in the room — that artifact is the take-home that makes the 1–2-hour build actually happen.
