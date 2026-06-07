# Simulation

This synthesis gathers every mention of simulation across the course into one teachable view. "Simulation" appears in the source in two distinct senses, and conflating them confuses students — so separate them up front.

## Two meanings of "simulation" in evals

| Sense | What it is | Where it shows up | Fidelity |
|---|---|---|---|
| **(A) Replay-as-simulation** | Running your agent against a *fixed set of inputs* (synthetic or stored) before exposing real users — vibe checks, offline evals, funnel runs | Ch 1, 2, 5, 6, 13 | Cheap, controlled, low realism |
| **(B) Agentic user simulation** | An *LLM playing a realistic user* (goal, persona, constraints) over multiple turns to test what static input/output pairs can't | Ch 12 (primary), Ch 2 (fidelity ladder) | More realistic for multi-turn, but cooperative & predictable |

Most of the course uses sense (A) implicitly; Chapter 12 is the only place sense (B) is taught explicitly and in depth. Teach (A) as "offline replay" and reserve the word "simulation" for (B) to keep students clear.

## Sense A — replay-as-simulation (the fidelity ladder)

Chapter 2 frames vibe checks and offline evals as *forms of simulation*: you replay representative inputs through the system before exposing real users. It lays out an explicit **fidelity ladder** — each rung trades control for realism:

1. **Hand-picked simulated inputs** (vibe check, 10–30 diverse inputs) — maximum control, minimum realism. (Ch 2)
2. **Larger curated/synthetic reference set** (offline eval) — moderate control and realism. (Ch 2, 5, 6)
3. **Real sampled sessions** (online monitoring) — minimum control, maximum realism. (Ch 2, 11)

In this sense, "offline testing is effectively running your agent against a fixed dataset — a simulation of production — to compare changes before they ship" (Ch 5). The code evals and judges are the *scoring function* that turns a pile of replayed traces into a pass rate (Ch 6). The **failure funnel** (Ch 13) is literally "run your reference dataset through the pipeline" — a simulation of production, measured step by step. The cardinal limit of sense-A simulation is exactly the one Chapter 8 names: replay over a clean, prototype-only dataset is "a fantasy version of the product" — controlled but unrepresentative.

## Sense B — agentic user simulation (Ch 12, the deep treatment)

**Definition.** "An LLM playing a realistic user (goal, persona, constraints) over 8–12 turns, to test what static input/output pairs can't" (Ch 12). The visual (`ch11-05-simulation-design.jpg`) shows an LLM-driven persona — goal, communication style, frustration trigger — conversing with the agent across branching turns.

**What it tests that nothing else can:**
- **Multi-turn branching** — real users take 8–12 turns of follow-ups, corrections, and course changes; a static dataset is single input/output rows (Ch 12).
- **Recovery from mistakes** — does the agent detect, diagnose, and adapt when the simulated user pushes back or the path goes wrong? (Ch 12 error-recovery dimension)
- **Context management over long conversations** — does context survive compaction/truncation across many turns? (Ch 12; the dimension Ch 7's "semantic completeness/context management" judge also targets)

**Where it sits in the layering loop.** Simulation is added *last* (Ch 12's "do NOT build all four layers at once" rule): binary success criteria → code evals (routing + skills) → LLM judges (full path) → **simulation (multi-turn), once you have a component + full-path baseline to compare against.** You invest in simulation specifically when "components are fine but the composed system fails" — i.e., integration and context management are the problem (Ch 12 decision guide).

## How PMs design simulated scenarios/users

Pulling the concrete design guidance together:

**Designing the simulated user (Sense B, Ch 12):** specify three things per persona —
- a **goal** (what the user is trying to accomplish),
- a **communication style/persona** (terse vs. verbose, expert vs. novice),
- a **frustration trigger / constraint** (what makes this user push back or change course).
Run 8–12-turn conversations and score: goal achievement, step count, interruption handling, and context retention (Ch 12 persona-simulator idea).

**Designing the replay scenario set (Sense A) — the User Input Grid is the discipline.** The closest thing to "how to design simulated scenarios" in the course is the **User Input Grid (UIG)** from Chapter 4, which is *engineered* coverage rather than "just ask an LLM for test queries":
1. Define 3–5 dimensions (ICP × persona × intent × context richness × ambiguity).
2. Generate 2–3 grounded examples per dimension.
3. Combine into a grid (e.g. 4×4×4 = 64), prune implausible cells to ~15–20 realistic scenarios.
4. Add real-world constraints (missing context, ambiguous terms, time sensitivity, conflicting requirements, business rules).
5. Have an LLM write 2–3 natural-language query variations per cell, *preserving realistic ambiguity*.

Chapter 4 is explicit that for early-stage products, "synthetic inputs generated with prompts are often the fastest way to explore the solution space" and "the goal isn't realism for its own sake but stress-testing across plausible scenarios" — the defining mindset of replay-as-simulation.

**Designing failure scenarios — deliberate failure injection (Ch 12).** A special form of simulation: you *manufacture* tool errors, unexpected schemas, partial results, and timeouts to build the error-recovery eval suite — "because real traces rarely contain enough clean examples of every failure type to test recovery systematically." This is synthetic simulation aimed squarely at the recovery dimension (detect / diagnose / retry).

## When to use simulation (decision guide)

| Situation | Use | Source |
|---|---|---|
| Early prototype, no production traffic yet | Replay-as-simulation over UIG-generated synthetic inputs | Ch 2, 4, 8 |
| Verifying a change before shipping (offline gate) | Replay the reference dataset; score with code evals + judges | Ch 2, 5, 6 |
| Visualizing where a multi-step pipeline breaks | Funnel run = replay the reference dataset step by step | Ch 13 |
| Testing multi-turn behavior, recovery, context management | Agentic user simulation (8–12-turn personas) | Ch 12 |
| Testing recovery from specific failure types | Failure injection (synthetic errors/timeouts/schemas) | Ch 12 |
| A downstream pipeline step is starved of traces (only survivors reach it) | Synthetic/targeted examples that *start* at that step | Ch 13 |
| Validating overall production quality | **Not** simulation — real sampled traffic (monitoring) | Ch 2, 11 |

## The limits of simulation (every caveat in the course)

The course is consistent and blunt: simulation is a coverage and regression tool, never a standalone verdict.

- **Simulated users are more cooperative, predictable, and less creative than real ones** (Ch 12). This bias is *exactly why* simulation is framed as a regression/coverage tool, not a standalone multi-turn verdict.
- **Always validate simulation against real production traces** (Ch 12, the chapter's hardest rule): "if simulation shows 90% goal completion but production monitoring shows 70%, the personas are wrong and must be updated."
- **Simulation cannot replace production monitoring** (Ch 12 misconception to pre-empt). Offline simulation = "what we knew to look for"; online monitoring = "what we didn't anticipate" (Ch 11). They are two halves of one quality system.
- **Replay over a clean synthetic dataset is a "fantasy version of the product"** (Ch 8). The synthetic→production transition exists precisely to escape this; treat synthetic data as scaffolding and replace/augment it with real traces as fast as possible.
- **Benchmark accuracy ≠ production accuracy** (Ch 12). Academic text-to-SQL benchmarks report 85–90% execution accuracy; real-world enterprise accuracy drops sharply once you add complex schemas, dialects, and multi-step reasoning. Simulated/benchmark conditions flatter the system.

## The connective thread

Across the course, simulation is the *bridge* in the fidelity ladder between pure synthetic data and pure production data (Ch 8). It is most valuable exactly where static data structurally fails — multi-turn, branching, recovery, long-context behavior — and most dangerous when trusted as ground truth. The PM's discipline is the same every time: **design the scenarios to stress reality (UIG, personas, failure injection), score them with your existing evals, and reconcile the result against real production traces before believing it.**
