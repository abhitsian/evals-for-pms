# Evals for PMs

**[🔗 Live site →](https://abhitsian.github.io/evals-for-pms/)**

A practical, teachable course on **evaluating AI products** — built for product managers, distilled from course recordings and module notes into instructor-ready material.

**14 chapters + 6 cross-cutting guides.** The spine is the *AI Flywheel*: define good → read traces → build datasets → automate evals → calibrate judges → iterate → monitor in production → repeat.

## What's here

```
chapters/   # source markdown — 14 chapters (01–14) + 7 synthesis docs (00, s1–s6)
docs/       # generated static site — this is the GitHub Pages root
build.mjs   # markdown → static site builder (marked)
style.css   # site styling
```

Each chapter follows one structure: *In one line · Why it matters for PMs · Core concepts · The mental model · Frameworks · Visual explainers · Dataset/simulation threads · Working with ML teams · Role of design · Process · References · Skill/template/app ideas · Teaching notes.*

The six cross-cutting guides weave threads that span chapters: **Mental Models, Simulation, Dataset Strategy (synthetic + actual data), ML Teams & Design, the End-to-End Process, and Skills/Templates/Apps to build.**

## Build

```bash
npm install
node build.mjs        # regenerates docs/
```

## Preview locally

```bash
open docs/index.html
```

## Publish to GitHub Pages

1. Create the repo and push (see commands below).
2. Repo **Settings → Pages → Build from a branch → `main` / `/docs`**.
3. Site goes live at `https://<user>.github.io/<repo>/`.

The `docs/.nojekyll` file is included so GitHub serves the files as-is.

---
*Built from course modules. Content is a study/teaching aid — verify before external use.*
