# Chapter 7 — LLM Judge-Based Evaluation: Design and Best Practices

## In one line
An LLM judge is a second model call that grades the output of your first model call against one narrow, binary quality question — and it's how you measure the subjective dimensions (tone, actionability, factual grounding) that code evals can never reach.

## Why it matters for PMs
Most of the quality metrics your users actually care about are not rule-like. A support reply can be factually correct and still feel dismissive in a way that drops CSAT. A generated UX can be accurate and still feel like "slop." A summary can hit every required point and still miss what the user actually needed. Teams hit this ceiling fast: code evals prevent obvious failures, but they cannot answer "Would a user accept this without rewriting it?" or "Is this specific enough to act on?" or "Is the agent asking for the right permissions — or doing too much, or too little?"

For a PM, the LLM judge is the instrument that turns "this feels off" into a number you can put a release gate on. It lets you encode your taste — the quality bar you'd apply by hand — into something that runs on every experiment. But the course is blunt about the catch: building a reliable custom judge is unglamorous, foundational work that teams are tempted to skip in favor of "out-of-the-box" evals that are rarely actionable. The judges that move the product are the ones you design narrowly for a failure pattern you found in your own traces.

## Core concepts
- **What a judge is.** A second model call. It takes a *trace* (the agent's output, plus optional context) and returns a *binary verdict* — Pass or Fail — plus a *reasoning string*. That's it.
- **Non-determinism is the price.** Run the same judge twice and you may get different results. You are buying the ability to measure subjective quality at the cost of the perfect reproducibility code evals give you.
- **The economics are different.** A judge costs inference on every run. A 50-ticket dataset with three judges is 150 model calls per experiment. So judges run *after* code evals pass — not instead of them, not in parallel with every trivial prompt change.
- **The practical threshold (the single most useful rule).** If a reviewer has to hold the original user request in mind and reason about tone, intent, or quality → LLM judge. If you can write the success condition as a Python function in under ten lines → code eval.
- **Four categories that consistently need a judge:**
  1. **Tone and empathy gaps** — technically correct but fails the human interaction (resolves the billing issue but ignores the customer's frustration). No regex equivalent.
  2. **Directness and actionability failures** — the agent hedges or over-qualifies. "Your account may have been affected" where "Your account was charged twice — here's how we'll fix it" was needed. Code can check a next step *exists*; only a judge can tell if it's genuinely actionable.
  3. **Factual grounding and memory problems** — claims that contradict retrieved context, overstated confidence, omitted information that was in the source. Requires reading output *and* source → a reference-based judge.
  4. **Semantic completeness and context management** — did the output address *all* parts of a multi-part request? Did the summary cover every key decision? Did context get lost after compaction or truncation? Pattern matching checks keywords; a judge checks whether the substance is there.
- **Reference-free vs reference-based** — the dividing line that decides what you can build today (see frameworks below).

## The mental model — how to think about this
Think of the judge as **an auditor, not an assistant.** The original model's job is to *produce*; the judge's job is to *inspect against one standard*. The most common way teams get this wrong is treating the judge like a generic quality rater ("rate this 1–10") instead of a specialist inspector ("does this response open by acknowledging the customer's specific frustration — yes or no?").

A second mental model: **what you feed in determines what you can measure.** This is a dial, not a default.
- Output only → you can judge tone, format, directness.
- Output + the original user query → you can judge relevance and responsiveness.
- Output + a reference document → you can judge factual accuracy and grounding.

Third model: **the reasoning string is your debugging interface, not decoration.** When the judge disagrees with your human reviewer on trace #23, the chain-of-thought tells you which of three things happened — the judge misunderstood the criterion, hit an edge case your examples didn't cover, or is actually right and your human was inconsistent. "Fail" with no explanation is useless at scale.

## Key frameworks / steps / loops

**The four-part anatomy of every LLM judge:**
1. **Inputs** — the trace, plus an optional reference (original query / ground-truth answer / retrieved context).
2. **The judge prompt** — role, single criterion, concrete standard, boundary examples.
3. **The LLM call** — use a reasoning model where possible; reasoning precedes verdict.
4. **The output** — Pass / Fail + a reasoning string.

**Two strict design rules high-performing teams follow:**
- **Rule 1 — Binary decisions.** A single Yes/No, never a Likert 1–5. Binary forces clarity (it meets the bar or it doesn't), is far easier to validate mathematically against human labels, and is harder to game. Break one complex 1–5 eval into several binary decisions. *Why not Likert:* expensive to align experts on what each number means; annotators default to middle values to dodge hard calls; encourages vague "overall quality" criteria instead of targeted failure modes.
- **Rule 2 — Narrow scope.** One trace category per judge. Past a few criteria, judges become inconsistent and you lose the ability to diagnose what moved. Narrow scope improves accuracy by typically 10–15% over comprehensive judges, enables per-dimension root-cause analysis, and lets you calibrate each judge independently.

**Reference-free vs reference-based (the build-order framework):**
| | Reference-free | Reference-based |
|---|---|---|
| Compares against | Nothing — judges the output on its own merits | An external reference: original query, ground-truth answer, or retrieved context |
| Measures | Directness, tone, presence of a next step, unsupported claims | Factual accuracy, grounding, correct category labels |
| What you need to build it | Any representative traces | Ground truth — expert-labeled outputs *or* access to retrieved context at inference time |
| **PM takeaway** | **Build these first; use them to bootstrap your dataset** | **Add once you have reliable ground truth** |

**What-to-judge filter — "start with what you can teach":**
- Good candidates (you can show the pass/fail boundary with crisp examples): "Does the response include a concrete next step?" / "Does it directly answer without deflecting?" / "Is the tone appropriate for a professional customer interaction?" / "Does the output make claims unsupported by the provided context?"
- Bad candidates (fuzzy, unteachable): "Is this high quality / delightful / insightful / creative?"
- The test: *if you can't write down what a pass looks like in plain language and give a few crisp examples, you're not ready to automate it yet.*

**Judge-prompt recipe (more structured than an agent prompt):**
- A clear **role** — reviewer/auditor, not the assistant.
- A **single evaluation question** — one attribute, one yes/no, built from your trace category.
- A **concrete standard** — described as observable behaviors; avoid abstract words unless you immediately operationalize them.
- **Boundary examples** — a few pass, a few fail, from the same domain; the most valuable are the *borderline* ones where reasonable people might disagree (that's where the judge drifts).
- **Self-reflection** — instruct "Think step-by-step" and "Check your reasoning" before the verdict; significantly improves consistency.
- **Strict output format** — JSON or YAML with a predictable label and a short justification, so it's parseable for dashboards.

**Reading results at scale (interpretation framework):**
- **Pass rate is a signal, not a verdict.** Empathy judge drops 88% → 62% after a prompt change? Something is suppressing the acknowledgment behavior — read ten failing cases and their reasoning strings *before* concluding the agent got worse.
- **Failure distribution over raw pass rate.** If 90% of actionability failures are on "Feature Request" tickets, you have a precise, targetable fix — not a broad revision.
- **Cross-judge correlation reveals root causes.** When empathy *and* actionability both fail on the same ticket, it's usually one failure mode (a short, terse response). Fix the root cause, not each judge separately.
- **Always compare to your production baseline.** 72% on factual grounding sounds bad in isolation; if production was 68%, it's an improvement. Set the baseline on the current prod version *before* iterating.
- **Verify the judge before blaming the model.** A judge returning "Fail — response is not a support interaction" on 40% of traces has a scope problem in its own prompt.

## Visual explainers
*(The Notion module embeds eight images, captured below with what each depicts and the teaching point. Source filenames are SCORM assets `ch6-01` through `ch6-08`.)*

- **[Visual: LLM-Judge categories]** (`ch6-01-llm-judge-categorie.png`) — The four subjective-quality categories that consistently need a judge: tone/empathy, directness/actionability, factual grounding/memory, semantic completeness/context management. *Teaching point:* a judge isn't for everything subjective — these four are the recurring, judge-shaped ones across products.
- **[Visual: LLM-Judge anatomy]** (`ch6-02-llm-judge-anatomy.jpg`) — The four-part structure: inputs (trace + optional reference) → judge prompt (role/criterion/standard/examples) → LLM call (reasoning before verdict) → output (Pass/Fail + reasoning string). *Teaching point:* every judge you ever build has this same skeleton; design happens inside the prompt box.
- **[Visual: Empathy judge prompt]** (`ch6-03-empathy-judge-promp.jpg`) — A worked example: the actual judge prompt that checks for empathetic acknowledgment on high-severity billing tickets in the Support Triage Agent. *Teaching point:* shows the recipe instantiated — auditor role, one yes/no question, observable standard, boundary examples.
- **[Visual: Reference-free vs reference-based]** (`ch6-04-reference-free-vs-b.png`) — Side-by-side of the two judge types and what each can measure given what you pass in. *Teaching point:* your available evidence (labeled data or not) decides which type you can build — start reference-free.
- **[Visual: Judge design principles]** (`ch6-05-judge-design-princi.jpg`) — The two strict rules: binary decisions and narrow scope, with the "why not Likert" reasoning. *Teaching point:* the discipline that separates reliable judges from "rate this 1–10" noise.
- **[Visual: Optimizing the judge prompt]** (`ch6-06-optimizing-judge-pr.jpg`) — The judge-prompt checklist: role, single question, concrete standard, boundary examples, self-reflection, strict output format. *Teaching point:* a judge prompt needs *more* structure than a normal agent prompt to cut ambiguity.
- **[Visual: Aggregate LLM-judge results]** (`ch6-07-aggregate-llm-judge.jpg`) — Running judges across the dataset and reading aggregate pass rates / failure distribution. *Teaching point:* the mechanics mirror code evals; the difference is cost, interpretation, and what "low pass rate" means.
- **[Visual: Failure modes]** (`ch6-08-failure-modes.jpg`) — The predictable ways calibrated judges break: gaming, distribution drift, novel outputs, deep-domain misses, style-over-substance. *Teaching point:* knowing the failure modes in advance lets you design around them.

## How this connects to: simulation / dataset strategy / synthetic data / actual data
- **To trace analysis (module 5):** the decision to build a judge *comes from* the diagnostic in the prior module — you identified a generalization gap (works sometimes, not consistently) where the criterion is subjective. Judges target the *specific* dimensions surfaced through trace analysis, never generic quality.
- **To dataset strategy (the next module):** reference-free judges can be built immediately from any representative traces, and you *use them to build your dataset*. Reference-based judges then require a reliable ground truth — expert-labeled outputs or retrieved-context access. The next module covers building and maintaining the reference datasets that keep the suite reliable as the product and user distribution shift.
- **To actual data / production:** always set your baseline on the current production version before iterating, and compare every new result against it. Pair judge scores with real-world signals — track user edits and explicit complaints alongside judge pass rates to catch gaming (judge up, CSAT flat).
- **To synthetic / novel output types:** judges break down on genuinely novel outputs (e.g., a new proactive-outreach feature) where there's no stable definition of "good" yet — the judge defaults to rewarding fluency and polish. New output types need fresh, real examples before a judge can be trusted on them.

## Working with ML / eng teams
- **Sequencing is a contract, not a preference.** Code evals run first, every time. LLM judges run only when code evals are green and the change is substantive. Make this explicit in the eval pipeline so judges don't burn inference on every trivial prompt tweak.
- **Cost is a real line item.** 50 items × 3 judges = 150 calls per run. Agree with eng on which judges run on which cadence (per-PR vs per-release).
- **Use a reasoning model for the judge where possible** — the chain-of-thought is the debugging interface.
- **Require structured output (JSON/YAML)** so results flow into dashboards; PM should specify the label + justification schema.
- **Calibration is a shared, recurring job** (the course flags a later "calibration section"): judges get validated against human labels, and binary verdicts make that validation mathematically clean. Own the human-label loop with eng/ops.
- **Distribution-drift maintenance is operational.** When the product expands to new segments/domains/ticket types, the example sets must be refreshed — this is ongoing work, not one-time setup.

## Role of design
- Design owns the **taste definition** that becomes the judge's standard. A judge for "tone appropriate for a professional customer interaction" or "feels like slop vs. feels crafted" is design's quality bar operationalized into observable behaviors — design should write or vet the pass/fail boundary and the borderline examples.
- The four judge categories map to UX failure surfaces designers already reason about: empathy in copy, directness/actionability of CTAs and next steps, grounding/trust, and completeness of a multi-part flow. Designers are the right source for the *borderline* examples where the line is genuinely contested.
- Watch the **style-over-substance** trap together: a judge can reward verbose responses that "look actionable" (mentioning timelines, escalation paths) while dodging the actual question. Design's eye is what catches that the polish is masking emptiness.

## Process to follow
1. **Start from a trace category.** Use trace analysis to find a generalization gap on a subjective dimension — don't invent a judge top-down.
2. **Apply the threshold test.** Sub-10-line Python → code eval. Needs held-in-mind reasoning about tone/intent/quality → judge.
3. **Check it's teachable.** Can you state pass/fail in plain language + a few crisp examples? If not, it's not ready to automate.
4. **Pick the type.** No labeled data yet → reference-free. Have ground truth or retrieved context → reference-based.
5. **Write the judge prompt** to the recipe: auditor role, one yes/no question, observable standard, pass + fail + *borderline* examples, "think step-by-step / check your reasoning," strict JSON/YAML output.
6. **Set the baseline** on the current production version.
7. **Run code evals first; run the judge only when they're green** and the change is substantive. Record Pass/Fail + reasoning per row.
8. **Read before you conclude.** Low pass rate → read ten failing cases and their reasoning strings; verify judge logic before blaming the model.
9. **Diagnose with distribution + correlation** — which segment fails, which judges co-fail — and make a targeted fix.
10. **Maintain.** Refresh example sets when the user distribution changes materially; track user edits/complaints alongside judge scores to catch gaming.

## References & sources
- **Source page:** "LLM Judge-Based Evaluation: Design and Best Practices" — Notion Meeting Note, dated 2026-06-06, in the *Meeting Notes* database. URL: https://app.notion.com/p/3775d11649418072a80dee62d2760094
- **Parent course page:** https://app.notion.com/p/3775d11649418037846eca378c6fc5e7 (the module's overview + footnote anchors live here).
- **Course platform:** Reforge (delivered via Docebo SCORM). Module title in the player: **"LLM-Judge based Evaluation."** Three lessons: (1) Intro, (2) Principles of LLM-Judge Design, (3) Recap and Further Learning. Player base URL: `https://cdn5.dcbstatic.com/files/r/e/reforge_docebosaas_com/.../scormcontent/index.html`
- **Embedded images:** eight SCORM assets, `ch6-01-llm-judge-categorie.png` through `ch6-08-failure-modes.jpg` (full list in Visual explainers above).
- **Running example throughout:** the **Support Triage Agent** (high-severity billing tickets; empathy and actionability judges; B2C vs. developer-account distribution drift).
- **Cross-module references:** Module 5 (trace analysis / generalization-gap diagnostic — the upstream trigger for building a judge); the *next* module (building and maintaining reference datasets); a later **calibration section** (validating binary judges against human labels — referenced but not in this module).
- *No external books, papers, or named individuals were cited in this module. The transcript is the instructor's spoken narration of the same three lessons (note: "code evals" is transcribed as "codigals/Codival" and "Likert" as "like-it" in the auto-transcript).*

## Skill / template / app ideas
- **`/judge-draft` skill** — input a trace category + a few example traces; output a judge prompt to the full recipe (auditor role, one binary question, observable standard, pass/fail/borderline examples, step-by-step instruction, JSON schema). Flags whether it should be reference-free or reference-based based on whether ground truth was provided.
- **Judge-prompt template file** — a fill-in-the-blanks markdown with the six recipe sections and a "borderline examples" table; ships as the canonical starting point.
- **"Is this judge-shaped?" decision card** — the threshold test + teachability test as a one-screen checklist (10-line-Python rule, plain-language-pass rule, good-vs-fuzzy candidate examples).
- **Judge results dashboard app** — ingests the JSON/YAML judge outputs and shows pass rate vs. baseline, failure distribution by segment, and cross-judge correlation heatmap; surfaces the ten worst reasoning strings for review.
- **Drift-watch automation** — alerts when the user distribution shifts (new segment/domain/ticket type) so example sets get refreshed before the judge silently mis-fires.
- **Gaming detector** — joins judge pass rate against user-edit rate / complaint rate; fires when judge metrics improve while user signals don't.

## Teaching notes (for the instructor)
- **Lead with the threshold test.** "Sub-ten-lines-of-Python → code; hold-the-request-in-mind-and-reason-about-tone → judge" is the single line PMs will remember and reuse. Anchor the whole module on it.
- **The "I understand" example lands well.** Code can confirm a response *contains* "I understand"; only a judge can tell if the acknowledgment is specific to the customer's situation or generic filler. Use it to make the code-vs-judge boundary concrete in one breath.
- **Hammer binary-over-Likert with the annotator behavior, not just the math.** The visceral point is "people default to 3 to avoid hard calls" — that's more persuasive to PMs than "easier to validate mathematically."
- **Reference-free vs reference-based is really a build-order lesson.** The takeaway isn't taxonomy — it's "if you have no labeled data, start reference-free and use it to *build* your dataset." Frame it as a sequencing decision.
- **Spend real time on failure modes — that's where PM judgment lives.** The empathy-boilerplate gaming story (judge up, CSAT flat, users editing out the preamble) is the most memorable beat; pair it with the B2C-billing-vs-developer drift story so PMs internalize that a judge is calibrated on *a distribution*, not on truth.
- **Reinforce "read before you conclude."** The 88%→62% drop and the "Fail — not a support interaction on 40%" example both teach the same discipline: the reasoning string is the first thing you read, not the pass rate.
- **Bridge forward clearly.** End on the dataset hand-off: judges depend on good reference data, which is the next module — and on calibration against humans, which comes later. The module is one link in a chain, not standalone.
