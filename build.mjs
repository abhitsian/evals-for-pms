// Build a static GitHub Pages site from the chapter + synthesis markdown files.
// Output -> docs/  (set GitHub Pages to deploy from /docs on the default branch)
import { marked } from "marked";
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, "chapters");
const OUT = join(__dirname, "docs");
mkdirSync(OUT, { recursive: true });

// ---- Navigation model -------------------------------------------------------
const GROUPS = [
  {
    label: "Start Here",
    items: [["00-overview", "Overview"]],
  },
  {
    label: "Course Chapters",
    items: [
      ["01-ai-flywheel", "1 · The AI Flywheel"],
      ["02-eval-lifecycle", "2 · Eval Lifecycle"],
      ["03-ai-native-prd", "3 · AI-Native PRD"],
      ["04-trace-analysis", "4 · Trace Analysis"],
      ["05-automated-evaluation", "5 · Automated Evaluation"],
      ["06-code-based-evals", "6 · Code-Based Evals"],
      ["07-llm-judge", "7 · LLM-as-Judge"],
      ["08-eval-datasets", "8 · Eval Datasets"],
      ["09-judge-alignment", "9 · Judge Alignment"],
      ["10-iteration-quality", "10 · Iteration & Quality"],
      ["11-user-monitoring", "11 · User Monitoring"],
      ["12-agent-decomposition", "12 · Agent Decomposition"],
      ["13-failure-funnels", "13 · Failure Funnels"],
      ["14-vibecoding-trace-apps", "14 · Vibecoding Trace Apps"],
    ],
  },
  {
    label: "Cross-Cutting Guides",
    items: [
      ["s1-mental-models", "Mental Models"],
      ["s2-simulation", "Simulation"],
      ["s3-dataset-strategy", "Dataset Strategy"],
      ["s4-ml-and-design", "ML Teams & Design"],
      ["s5-process", "The Eval Process"],
      ["s6-skills-and-apps", "Skills, Templates & Apps"],
    ],
  },
];

const ALL = GROUPS.flatMap((g) => g.items.map(([slug]) => slug));

// ---- Marked config: heading anchors -----------------------------------------
const slugify = (s) =>
  s.toLowerCase().replace(/<[^>]+>/g, "").replace(/[^\w]+/g, "-").replace(/^-+|-+$/g, "");

const renderer = new marked.Renderer();
renderer.heading = function (text, level) {
  const id = slugify(text);
  return `<h${level} id="${id}"><a class="anchor" href="#${id}">#</a>${text}</h${level}>\n`;
};
marked.setOptions({ renderer, gfm: true, breaks: false });

// ---- Per-page sidebar -------------------------------------------------------
function sidebar(active) {
  let html = `<a class="brand" href="index.html"><span class="brand-mark">▣</span> Evals for PMs</a>`;
  for (const g of GROUPS) {
    html += `<div class="nav-group">${g.label}</div>`;
    for (const [slug, title] of g.items) {
      const cls = slug === active ? "nav-link active" : "nav-link";
      html += `<a class="${cls}" href="${slug}.html">${title}</a>`;
    }
  }
  return `<nav class="sidebar">${html}</nav>`;
}

// Post-process HTML: turn "[Visual: ...]" paragraphs into callout cards,
// and flag em-dash "—" only paragraphs lightly.
function decorate(html) {
  html = html.replace(
    /<(p|li)><strong>\[Visual:([^\]]*)\]<\/strong>([\s\S]*?)<\/\1>/g,
    (_, tag, title, body) =>
      `<div class="visual"><div class="visual-tag">🖼 Visual</div><p><strong>${title.trim()}</strong>${body}</p></div>`
  );
  return html;
}

function page({ title, body, active, prev, next }) {
  const nav = (rel, label, slug) =>
    slug
      ? `<a class="pager ${rel}" href="${slug}.html"><span>${rel === "prev" ? "←" : "→"}</span><span>${label}</span></a>`
      : `<span></span>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · Evals for PMs</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
<button class="menu-toggle" onclick="document.body.classList.toggle('nav-open')">☰ Menu</button>
${sidebar(active)}
<main class="content">
<article class="prose">
${body}
</article>
<div class="pager-row">
${nav("prev", prev?.title ?? "", prev?.slug)}
${nav("next", next?.title ?? "", next?.slug)}
</div>
<footer class="foot">Evals for PMs · built from course modules · ${ALL.length} sections</footer>
</main>
<div class="scrim" onclick="document.body.classList.remove('nav-open')"></div>
</body>
</html>`;
}

// ---- Render each markdown page ---------------------------------------------
const titleOf = (slug) =>
  GROUPS.flatMap((g) => g.items).find(([s]) => s === slug)?.[1] ?? slug;

for (let i = 0; i < ALL.length; i++) {
  const slug = ALL[i];
  const md = readFileSync(join(SRC, `${slug}.md`), "utf8");
  const h1 = (md.match(/^#\s+(.+)$/m) || [, slug])[1];
  const body = decorate(marked.parse(md));
  const prev = i > 0 ? { slug: ALL[i - 1], title: titleOf(ALL[i - 1]) } : null;
  const next = i < ALL.length - 1 ? { slug: ALL[i + 1], title: titleOf(ALL[i + 1]) } : null;
  writeFileSync(join(OUT, `${slug}.html`), page({ title: h1, body, active: slug, prev, next }));
}

// ---- Landing page -----------------------------------------------------------
const cards = GROUPS.flatMap((g) => g.items)
  .map(([slug, title]) => {
    const md = readFileSync(join(SRC, `${slug}.md`), "utf8");
    const one = (md.match(/## In one line\s*\n+([^\n]+)/) || [])[1] ||
      (md.split("\n").find((l) => l && !l.startsWith("#")) || "").trim();
    const num = title.split(" · ")[0];
    return `<a class="card" href="${slug}.html">
      <div class="card-num">${num.match(/^\d+$/) ? num : "•"}</div>
      <div class="card-body"><h3>${title}</h3><p>${one.replace(/[*_`]/g, "").slice(0, 160)}</p></div>
    </a>`;
  })
  .join("\n");

const landing = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Evals for PMs — A Practical Course</title>
<link rel="stylesheet" href="style.css"></head>
<body>
<button class="menu-toggle" onclick="document.body.classList.toggle('nav-open')">☰ Menu</button>
${sidebar("index")}
<main class="content">
<header class="hero">
  <div class="kicker">A practical course · for product managers</div>
  <h1>Evals for PMs</h1>
  <p class="lede">How to define, measure, and compound the quality of AI products — the mental models, the dataset strategy, the judge calibration, and the day-to-day process a PM runs to make probabilistic systems trustworthy.</p>
  <div class="hero-meta">14 chapters · 6 cross-cutting guides · built from course recordings &amp; notes</div>
  <div class="hero-cta">
    <a class="btn primary" href="00-overview.html">Start with the Overview →</a>
    <a class="btn" href="s5-process.html">Jump to the Process playbook</a>
  </div>
</header>
<section class="cards">${cards}</section>
<footer class="foot">Evals for PMs · built from course modules</footer>
</main>
<div class="scrim" onclick="document.body.classList.remove('nav-open')"></div>
</body></html>`;
writeFileSync(join(OUT, "index.html"), landing);

// GitHub Pages: don't run Jekyll over our files
writeFileSync(join(OUT, ".nojekyll"), "");
copyFileSync(join(__dirname, "style.css"), join(OUT, "style.css"));

console.log(`Built ${ALL.length} pages + landing -> docs/`);
