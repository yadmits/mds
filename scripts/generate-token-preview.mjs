import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const tokensPath = path.join(root, "knowledge-base", "tokens", "tokens.catalog.json");
const iconsPath = path.join(root, "knowledge-base", "icons", "icons.catalog.json");
const buttonsPath = path.join(root, "knowledge-base", "components", "buttons.catalog.json");
const fontSourceDir = path.join(root, "knowledge-base", "assets", "fonts");
const outDir = path.join(root, "preview");
const outPath = path.join(outDir, "tokens.html");
const outFontDir = path.join(outDir, "assets", "fonts");

const catalog = JSON.parse(fs.readFileSync(tokensPath, "utf8"));
const iconsCatalog = fs.existsSync(iconsPath) ? JSON.parse(fs.readFileSync(iconsPath, "utf8")) : { icons: [] };
const buttonsCatalog = fs.existsSync(buttonsPath)
  ? JSON.parse(fs.readFileSync(buttonsPath, "utf8"))
  : { sizes: [], filledTypes: [], linkTypes: [] };

const colorGroup = catalog.tokenGroups.find((g) => g.group === "color");
const typoGroup = catalog.tokenGroups.find((g) => g.group === "typography");
const effectGroup = catalog.tokenGroups.find((g) => g.group === "effect");

const colors = (colorGroup?.items || []).filter((i) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/.test(i.value || ""));
const typo = typoGroup?.items || [];
const effects = effectGroup?.items || [];
const icons = iconsCatalog.icons || [];

const colorLookup = new Map(colors.map((token) => [String(token.name || "").toLowerCase(), token.value]));
const typoLookup = new Map(typo.map((token) => [String(token.name || "").toLowerCase(), token]));
const iconLookup = new Map(icons.map((icon) => [String(icon.name || "").toLowerCase(), icon]));

const colorSections = renderColorSections(groupBy(colors, (t) => getColorGroupName(t)));
const typoSections = renderTypographySections(groupBy(typo, (t) => getTypographyGroupName(t)));
const effectSections = renderEffectSections(groupBy(effects, (t) => getEffectGroupName(t)));
const iconSections = renderIconSections(groupBy(icons, (t) => getIconGroupName(t)), colorLookup);
const buttonsSections = renderButtonsPage({
  catalog: buttonsCatalog,
  typoLookup,
  colorLookup,
  iconLookup
});
const buttonConstructorData = buildButtonConstructorData({
  catalog: buttonsCatalog,
  typoLookup,
  colorLookup,
  iconLookup
});

const html = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Mindbox DS Preview</title>
  <style>
    @font-face {
      font-family: "CoFo Sans Variable";
      src: local("CoFo Sans Variable"),
           url("./assets/fonts/CoFoSansVariable.woff2") format("woff2"),
           url("./assets/fonts/CoFoSansVariable.woff") format("woff");
      font-display: swap;
    }
    :root {
      --bg: #eef2f6;
      --panel: #ffffff;
      --ink: #15161b;
      --muted: #69707f;
      --border: #d7dee6;
      --accent: #39aa5d;
      --sidebar-bg: #15161b;
      --sidebar-ink: #d3d8df;
      --sidebar-active: #56d67f;
      --sidebar-w: 240px;
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      background:
        radial-gradient(1200px 560px at 0% -10%, #dff2df 0%, rgba(223, 242, 223, 0) 60%),
        linear-gradient(180deg, #f3f6f9 0%, #eef2f6 60%, #ebeff3 100%);
      color: var(--ink);
      font-family: "CoFo Sans Variable", "Helvetica Neue", Helvetica, Arial, sans-serif;
    }
    .app {
      min-height: 100vh;
      display: grid;
      grid-template-columns: var(--sidebar-w) 1fr;
    }
    .sidebar {
      position: sticky;
      top: 0;
      height: 100vh;
      background: var(--sidebar-bg);
      border-right: 1px solid #2a2d35;
      padding: 20px 14px;
    }
    .brand {
      margin: 0 0 18px;
      color: #fff;
      font-size: 18px;
      letter-spacing: -0.02em;
    }
    .nav {
      display: grid;
      gap: 6px;
    }
    .nav-link {
      text-decoration: none;
      color: var(--sidebar-ink);
      border: 1px solid transparent;
      border-radius: 12px;
      padding: 10px 12px;
      font-size: 14px;
      transition: all 0.16s ease;
      display: block;
    }
    .nav-link:hover {
      border-color: #3a3f4a;
      color: #fff;
      background: #1f2229;
    }
    .nav-link.active {
      color: #0f1d14;
      background: var(--sidebar-active);
      border-color: transparent;
      font-weight: 600;
    }
    .main {
      padding: 24px 20px 84px;
    }
    .page { display: none; max-width: 1600px; }
    .page.active { display: block; }
    .header {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 22px;
      padding: 20px 22px;
      margin-bottom: 18px;
    }
    .header-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }
    .theme-toggle {
      border: 1px solid var(--border);
      background: #f8fafc;
      border-radius: 999px;
      padding: 8px 12px;
      font-size: 12px;
      cursor: pointer;
      color: #253042;
      transition: background-color 120ms ease;
    }
    .theme-toggle:hover { background: #eef4f8; }
    .title { margin: 0 0 8px; font-size: 30px; line-height: 1.05; letter-spacing: -0.02em; }
    .subtitle { margin: 0; color: var(--muted); font-size: 14px; }
    .legend { margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap; }
    .chip {
      border: 1px solid var(--border);
      background: #f8fafc;
      border-radius: 999px;
      padding: 6px 12px;
      font-size: 12px;
      line-height: 1;
      color: #253042;
    }
    .chip b { color: var(--accent); }
    .section {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 22px;
      padding: 14px;
      margin-top: 14px;
    }
    .section h2 {
      margin: 4px 8px 14px;
      font-size: 20px;
      letter-spacing: -0.02em;
    }
    .group {
      border: 1px solid var(--border);
      border-radius: 18px;
      background: #f9fbfc;
      padding: 10px;
      margin: 10px 6px;
    }
    .group-title {
      margin: 2px 4px 10px;
      font-size: 14px;
      font-weight: 600;
      color: #202c3d;
    }
    .hint {
      margin: 4px 8px 14px;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.35;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 12px;
    }
    .card {
      border: 1px solid var(--border);
      border-radius: 14px;
      overflow: hidden;
      background: #fff;
    }
    .swatch { height: 84px; border-bottom: 1px solid var(--border); }
    .meta { padding: 10px; display: grid; gap: 4px; }
    .name { font-size: 12px; line-height: 1.25; font-weight: 600; }
    .value, .cat { font-size: 12px; color: var(--muted); }
    .types {
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px;
    }
    .type-card {
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 14px;
      background: #fff;
    }
    .type-header { margin-bottom: 8px; }
    .type-header .name { font-size: 20px; letter-spacing: -0.03em; }
    .spec { color: var(--muted); font-size: 12px; line-height: 1.2; }
    .sample { margin: 0; overflow-wrap: anywhere; }
    .effects {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 12px;
    }
    .effect-card {
      border: 1px solid var(--border);
      border-radius: 14px;
      background: #fff;
      overflow: hidden;
    }
    .effect-preview {
      height: 110px;
      border-bottom: 1px solid var(--border);
      padding: 18px;
      position: relative;
      background: linear-gradient(135deg, #f7f9fb 0%, #eef3f7 100%);
    }
    .effect-demo {
      width: 88px;
      height: 56px;
      border-radius: 12px;
      background: #ffffff;
      border: 1px solid #d7dee6;
    }
    .effect-meta {
      padding: 10px;
      display: grid;
      gap: 4px;
    }
    .effect-name { font-size: 13px; font-weight: 600; }
    .effect-value, .effect-note {
      font-size: 12px;
      color: var(--muted);
      line-height: 1.3;
    }
    .effect-empty {
      border: 1px dashed #c8d0da;
      border-radius: 14px;
      padding: 14px;
      font-size: 13px;
      color: var(--muted);
      background: #fbfcfd;
    }
    .icons {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 12px;
    }
    .icon-card {
      border: 1px solid var(--border);
      border-radius: 14px;
      background: #fff;
      padding: 12px;
      display: grid;
      gap: 8px;
    }
    .icon-demo {
      height: 70px;
      border: 1px solid var(--border);
      border-radius: 12px;
      background: linear-gradient(180deg, #f6f9fc 0%, #f0f4f8 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #292b32;
      font-size: 22px;
      letter-spacing: -0.03em;
      font-weight: 500;
    }
    .icon-demo img {
      width: 24px;
      height: 24px;
      object-fit: contain;
      display: block;
    }
    .icon-name { font-size: 13px; font-weight: 600; line-height: 1.2; }
    .icon-meta { font-size: 12px; color: var(--muted); line-height: 1.25; }
    .token-chips {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .token-chip {
      border: 1px solid var(--border);
      border-radius: 999px;
      background: #f9fbfd;
      padding: 4px 8px;
      font-size: 11px;
      color: #2a3445;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .token-dot {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      border: 1px solid rgba(0,0,0,0.08);
      flex: 0 0 8px;
    }
    .anchor-nav {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 0 0 10px;
      padding: 0;
      list-style: none;
    }
    .anchor-link {
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      border: 1px solid var(--border);
      border-radius: 999px;
      padding: 6px 11px;
      font-size: 12px;
      color: #2a3445;
      background: #f8fbfd;
    }
    .anchor-link:hover { background: #edf4f9; }
    .constructor {
      border: 1px solid var(--border);
      border-radius: 14px;
      background: #fff;
      padding: 12px;
      margin-top: 8px;
      display: grid;
      grid-template-columns: minmax(260px, 420px) 1fr;
      gap: 12px;
    }
    .constructor-preview {
      border: 1px solid var(--border);
      border-radius: 12px;
      background: linear-gradient(180deg, #f7fafc 0%, #f2f6fa 100%);
      padding: 14px;
      min-height: 140px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .constructor-preview.dark {
      background: linear-gradient(180deg, #2b2e35 0%, #252931 100%);
      border-color: #3b3f49;
    }
    .constructor-controls {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
      margin-bottom: 10px;
    }
    .constructor-controls label {
      font-size: 11px;
      color: var(--muted);
      display: grid;
      gap: 4px;
    }
    .constructor-controls select {
      border: 1px solid var(--border);
      border-radius: 8px;
      background: #fff;
      color: var(--ink);
      padding: 6px 8px;
      font-family: inherit;
      font-size: 12px;
    }
    .constructor-props {
      border: 1px solid var(--border);
      border-radius: 10px;
      background: #f9fbfd;
      padding: 10px;
      font-size: 12px;
      line-height: 1.4;
      color: #223047;
      white-space: pre-wrap;
    }
    .btn-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
      gap: 12px;
    }
    .btn-card {
      border: 1px solid var(--border);
      border-radius: 14px;
      background: #fff;
      padding: 12px;
    }
    .btn-card-head {
      font-size: 12px;
      color: var(--muted);
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
    }
    .btn-row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }
    .btn-demo-label {
      font-size: 11px;
      color: var(--muted);
      margin-bottom: 6px;
    }
    .btn-demo {
      min-height: 74px;
      border: 1px solid var(--border);
      border-radius: 10px;
      background: linear-gradient(180deg, #f7fafc 0%, #f2f6fa 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 10px;
    }
    .btn-demo.dark-sample {
      background: linear-gradient(180deg, #2b2e35 0%, #252931 100%);
      border-color: #3b3f49;
    }
    .ds-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--btn-gap, 8px);
      border: none;
      text-decoration: none;
      cursor: pointer;
      transform: scale(1);
      transition: transform 160ms cubic-bezier(0.2, 0.8, 0.2, 1), background-color 180ms ease, color 180ms ease, border-color 180ms ease, padding-inline 180ms ease, border-radius 180ms ease;
      will-change: transform;
      white-space: nowrap;
      user-select: none;
      padding-inline: var(--btn-pad-x);
      min-height: var(--btn-h);
      border-radius: var(--btn-radius);
    }
    .ds-btn.filled {
      background: var(--btn-bg);
      color: var(--btn-color);
      border: 1px solid transparent;
    }
    .ds-btn.link {
      background: transparent;
      color: var(--btn-color);
      border: 1px solid transparent;
      padding-inline: 0;
      --btn-link-hover-pad-x: var(--btn-pad-x);
      --btn-link-hover-radius: var(--btn-radius);
    }
    .ds-btn.link:not(.is-disabled):hover,
    .ds-btn.link:not(.is-disabled):active {
      padding-inline: var(--btn-link-hover-pad-x);
      border-radius: var(--btn-link-hover-radius);
    }
    .ds-btn:not(.is-disabled):hover {
      background: var(--btn-bg-hover);
      color: var(--btn-color-hover);
    }
    .ds-btn:not(.is-disabled):active {
      transform: scale(0.98);
    }
    .ds-btn .icon-static {
      width: var(--btn-icon-size, 16px);
      height: var(--btn-icon-size, 16px);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 var(--btn-icon-size, 16px);
      line-height: 1;
      transform: translateY(var(--btn-icon-shift, 0px));
    }
    .ds-btn .icon-mask {
      width: 100%;
      height: 100%;
      background-color: currentColor;
      -webkit-mask: var(--icon-mask) center / contain no-repeat;
      mask: var(--icon-mask) center / contain no-repeat;
    }
    .ds-btn.is-disabled {
      cursor: not-allowed;
      opacity: 0.92;
    }
    .ds-btn {
      backdrop-filter: blur(var(--btn-backdrop-blur, 0px));
      -webkit-backdrop-filter: blur(var(--btn-backdrop-blur, 0px));
    }
    .ds-btn.link {
      transition: transform 160ms cubic-bezier(0.2, 0.8, 0.2, 1), background-color 90ms ease, color 90ms ease, border-color 90ms ease, padding-inline 120ms ease 90ms, border-radius 120ms ease 90ms;
    }
    .ds-btn.link:not(.is-disabled):hover,
    .ds-btn.link:not(.is-disabled):active {
      transition: transform 160ms cubic-bezier(0.2, 0.8, 0.2, 1), background-color 90ms ease, color 90ms ease, border-color 90ms ease, padding-inline 120ms ease, border-radius 120ms ease;
    }
    code {
      background: #f2f5f8;
      border: 1px solid #e0e6ed;
      border-radius: 6px;
      padding: 1px 5px;
      font-size: 11px;
    }
    body[data-theme="dark"] {
      --bg: #171a22;
      --panel: #1f2430;
      --ink: #e9edf6;
      --muted: #aeb7c6;
      --border: #343b49;
      --accent: #56d67f;
    }
    body[data-theme="dark"] .chip,
    body[data-theme="dark"] .token-chip,
    body[data-theme="dark"] .anchor-link,
    body[data-theme="dark"] .theme-toggle {
      background: #262d3a;
      color: #e9edf6;
      border-color: #3b4456;
    }
    body[data-theme="dark"] .group,
    body[data-theme="dark"] .type-card,
    body[data-theme="dark"] .card,
    body[data-theme="dark"] .effect-card,
    body[data-theme="dark"] .icon-card,
    body[data-theme="dark"] .btn-card {
      background: #202734;
      border-color: #384152;
    }
    body[data-theme="dark"] .group-title,
    body[data-theme="dark"] .name,
    body[data-theme="dark"] .icon-name {
      color: #f3f6fd;
    }
    body[data-theme="dark"] .icon-demo,
    body[data-theme="dark"] .btn-demo {
      background: linear-gradient(180deg, #2c3341 0%, #252b37 100%);
      border-color: #3d4658;
      color: #fff;
    }
    @media (max-width: 980px) {
      :root { --sidebar-w: 100%; }
      .app { grid-template-columns: 1fr; }
      .sidebar {
        height: auto;
        position: static;
        border-right: none;
        border-bottom: 1px solid #2a2d35;
      }
      .nav { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .btn-grid { grid-template-columns: 1fr; }
      .btn-row { grid-template-columns: 1fr; }
      .constructor { grid-template-columns: 1fr; }
      .constructor-controls { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
  </style>
</head>
<body>
  <div class="app">
    <aside class="sidebar">
      <h1 class="brand">Mindbox DS</h1>
      <nav class="nav">
        <a class="nav-link" data-nav="tokens" href="#tokens">Tokens</a>
        <a class="nav-link" data-nav="buttons" href="#buttons">Buttons</a>
      </nav>
    </aside>
    <main class="main">
      <section class="page" data-page="tokens">
        <header class="header">
          <div class="header-row">
            <div>
              <h1 class="title">Mindbox DS Tokens Preview</h1>
              <p class="subtitle">Source: ${escapeHtml(catalog.sources?.[0]?.name || "unknown")} | Updated: ${escapeHtml(
  catalog.lastUpdated || "unknown"
              )}</p>
            </div>
            <button class="theme-toggle" type="button" data-theme-toggle>Theme: Light</button>
          </div>
          <div class="legend">
            <span class="chip">Colors: <b>${colors.length}</b></span>
            <span class="chip">Typography: <b>${typo.length}</b></span>
            <span class="chip">Effects: <b>${effects.length}</b></span>
            <span class="chip">Icons: <b>${icons.length}</b></span>
          </div>
        </header>

        <section class="section">
          <h2>Colors (${colors.length})</h2>
          ${colorSections}
        </section>

        <section class="section">
          <h2>Typography (${typo.length})</h2>
          ${typoSections}
        </section>

        <section class="section">
          <h2>Effects (${effects.length})</h2>
          ${effectSections}
        </section>

        <section class="section">
          <h2>Icons (${icons.length})</h2>
          <p class="hint">Rule: icon color inherits <code>currentColor</code> and should use text color tokens (same as button/input/badge text).</p>
          ${iconSections}
        </section>
      </section>

      <section class="page" data-page="buttons">
        <header class="header">
          <div class="header-row">
            <div>
              <h1 class="title">Buttons</h1>
              <p class="subtitle">Figma source node: <code>6483:5558</code> | Hover: token mapping | Active: <code>scale(0.98)</code> | Arrow appears only on hover.</p>
            </div>
            <button class="theme-toggle" type="button" data-theme-toggle>Theme: Light</button>
          </div>
          <ul class="anchor-nav">
            <li><a class="anchor-link" href="#buttons-constructor">Constructor</a></li>
            <li><a class="anchor-link" href="#buttons-filled">BG=true</a></li>
            <li><a class="anchor-link" href="#buttons-link">BG=false</a></li>
            <li><a class="anchor-link" href="#buttons-rounded">Rounded</a></li>
            <li><a class="anchor-link" href="#buttons-content">Content Variants</a></li>
          </ul>
          <section id="buttons-constructor" class="constructor">
            <div class="constructor-preview" data-constructor-preview>
              <button class="ds-btn filled" type="button">Button</button>
            </div>
            <div>
              <div class="constructor-controls">
                <label>Mode
                  <select data-ctrl="mode"></select>
                </label>
                <label>Type
                  <select data-ctrl="type"></select>
                </label>
                <label>Size
                  <select data-ctrl="size"></select>
                </label>
                <label>Content
                  <select data-ctrl="content"></select>
                </label>
                <label>Rounded
                  <select data-ctrl="rounded"></select>
                </label>
                <label>Theme
                  <select data-ctrl="theme"></select>
                </label>
              </div>
              <div class="constructor-props" data-constructor-props>Loading...</div>
            </div>
          </section>
        </header>

        ${buttonsSections}
      </section>
    </main>
  </div>
  <script>
    const BUTTON_CONSTRUCTOR_DATA = ${JSON.stringify(buttonConstructorData)};
    (function () {
      const nav = Array.from(document.querySelectorAll("[data-nav]"));
      const pages = Array.from(document.querySelectorAll("[data-page]"));
      const themeButtons = Array.from(document.querySelectorAll("[data-theme-toggle]"));

      function resolvePage() {
        const raw = window.location.hash.replace("#", "").trim();
        if (raw === "buttons" || raw.startsWith("buttons-")) return "buttons";
        return "tokens";
      }

      function render() {
        const page = resolvePage();
        pages.forEach((el) => el.classList.toggle("active", el.dataset.page === page));
        nav.forEach((el) => el.classList.toggle("active", el.dataset.nav === page));
      }

      function applyTheme(theme) {
        document.body.setAttribute("data-theme", theme);
        const label = theme === "dark" ? "Theme: Dark" : "Theme: Light";
        themeButtons.forEach((btn) => (btn.textContent = label));
      }

      function toggleTheme() {
        const current = document.body.getAttribute("data-theme") === "dark" ? "dark" : "light";
        const next = current === "dark" ? "light" : "dark";
        localStorage.setItem("mb-ds-theme", next);
        applyTheme(next);
      }

      function initButtonConstructor() {
        const root = document.querySelector("[data-constructor-preview]")?.closest(".constructor");
        if (!root || !BUTTON_CONSTRUCTOR_DATA || !Array.isArray(BUTTON_CONSTRUCTOR_DATA.items)) return;
        const preview = root.querySelector("[data-constructor-preview]");
        const props = root.querySelector("[data-constructor-props]");
        const ctrlMode = root.querySelector('[data-ctrl="mode"]');
        const ctrlType = root.querySelector('[data-ctrl="type"]');
        const ctrlSize = root.querySelector('[data-ctrl="size"]');
        const ctrlContent = root.querySelector('[data-ctrl="content"]');
        const ctrlRounded = root.querySelector('[data-ctrl="rounded"]');
        const ctrlTheme = root.querySelector('[data-ctrl="theme"]');

        const controls = [ctrlMode, ctrlType, ctrlSize, ctrlContent, ctrlRounded, ctrlTheme].filter(Boolean);
        if (controls.length !== 6) return;

        function setOptions(select, values) {
          select.innerHTML = values.map((v) => '<option value=\"' + v.value + '\">' + v.label + '</option>').join("");
        }

        setOptions(ctrlMode, BUTTON_CONSTRUCTOR_DATA.modes.map((v) => ({ value: v, label: v })));
        setOptions(ctrlSize, BUTTON_CONSTRUCTOR_DATA.sizes.map((v) => ({ value: v, label: v })));
        setOptions(ctrlContent, BUTTON_CONSTRUCTOR_DATA.contents.map((v) => ({ value: v.id, label: v.label })));
        setOptions(ctrlRounded, BUTTON_CONSTRUCTOR_DATA.roundedModes.map((v) => ({ value: v.id, label: v.label })));
        setOptions(ctrlTheme, [
          { value: "auto", label: "Auto" },
          { value: "light", label: "Light sample" },
          { value: "dark", label: "Dark sample" }
        ]);

        function syncTypeOptions() {
          const mode = ctrlMode.value;
          const items = BUTTON_CONSTRUCTOR_DATA.typesByMode[mode] || [];
          const prev = ctrlType.value;
          setOptions(ctrlType, items.map((v) => ({ value: v.name, label: v.name })));
          if (items.some((x) => x.name === prev)) ctrlType.value = prev;
        }

        function renderCtor() {
          const mode = ctrlMode.value;
          const type = ctrlType.value;
          const size = ctrlSize.value;
          const content = ctrlContent.value;
          const rounded = ctrlRounded.value;
          const selectedTheme = ctrlTheme.value;

          const item = BUTTON_CONSTRUCTOR_DATA.items.find((x) =>
            x.mode === mode &&
            x.type === type &&
            x.size === size &&
            x.content === content &&
            x.rounded === rounded
          );
          if (!item) return;

          const effectiveTheme = selectedTheme === "auto" ? item.recommendedTheme : selectedTheme;
          preview.classList.toggle("dark", effectiveTheme === "dark");
          preview.innerHTML = item.htmlByTheme[effectiveTheme] || item.htmlByTheme.light || "";
          props.textContent = item.details;
        }

        ctrlMode.addEventListener("change", () => {
          syncTypeOptions();
          renderCtor();
        });
        [ctrlType, ctrlSize, ctrlContent, ctrlRounded, ctrlTheme].forEach((el) => el.addEventListener("change", renderCtor));

        ctrlMode.value = "filled";
        syncTypeOptions();
        ctrlType.value = "Primary";
        ctrlSize.value = "M";
        ctrlContent.value = "text";
        ctrlRounded.value = "rounded";
        ctrlTheme.value = "auto";
        renderCtor();
      }

      themeButtons.forEach((btn) => btn.addEventListener("click", toggleTheme));

      const savedTheme = localStorage.getItem("mb-ds-theme");
      applyTheme(savedTheme === "dark" ? "dark" : "light");
      initButtonConstructor();

      window.addEventListener("hashchange", render);
      render();
    })();
  </script>
</body>
</html>
`;

fs.mkdirSync(outDir, { recursive: true });
copyFontsIfPresent(fontSourceDir, outFontDir);
fs.writeFileSync(outPath, html, "utf8");
console.log(`Generated: ${outPath}`);

function escapeHtml(input) {
  return String(input)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function cssEscape(input) {
  return String(input).replaceAll("'", "\\'");
}

function toCssLetterSpacing(value, unit) {
  if (unit === "px") return `${value}px`;
  return `${value / 100}em`;
}

function copyFontsIfPresent(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(destDir, { recursive: true });
  const files = fs.readdirSync(srcDir).filter((f) => /\.(woff2?|ttf|otf)$/i.test(f));
  for (const file of files) fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
}

function groupBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
}

function getColorGroupName(token) {
  const top = String(token.name || "").split("/")[0].trim();
  return top || token.category || "Other";
}

function getTypographyGroupName(token) {
  const name = String(token.name || "");
  if (name.startsWith("Mobile/")) return "Mobile";
  if (name.startsWith("Button Component/")) return "Button Component";
  if (name.startsWith("Link/Underlined/")) return "Link Underlined";
  if (name.startsWith("Digit/")) return "Digit";
  return "Desktop Core";
}

function renderColorSections(groupedColors) {
  return Array.from(groupedColors.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([groupName, items]) => {
      const cards = items
        .sort((a, b) => String(a.name).localeCompare(String(b.name)))
        .map(
          (t) => `
      <article class="card">
        <div class="swatch" style="background:${t.value}"></div>
        <div class="meta">
          <div class="name">${escapeHtml(t.name)}</div>
          <div class="value">${t.value}</div>
          <div class="cat">${escapeHtml(t.category || "uncategorized")}</div>
        </div>
      </article>
    `
        )
        .join("");
      return `
      <section class="group">
        <h3 class="group-title">${escapeHtml(groupName)} (${items.length})</h3>
        <div class="grid">${cards}</div>
      </section>
    `;
    })
    .join("");
}

function renderTypographySections(groupedTypography) {
  return Array.from(groupedTypography.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([groupName, items]) => {
      const rows = items
        .sort((a, b) => String(a.name).localeCompare(String(b.name)))
        .map((t) => {
          const lsRaw = Number(t.letterSpacing) || 0;
          const lsUnit = t.letterSpacingUnit || "percent";
          const cssLetterSpacing = toCssLetterSpacing(lsRaw, lsUnit);
          const viewLetterSpacing = `${lsRaw}${lsUnit === "px" ? "px" : "%"}`;
          const style = [
            `font-family: '${cssEscape(t.family || "sans-serif")}', sans-serif`,
            `font-size:${Number(t.size) || 16}px`,
            `line-height:${Number(t.lineHeight) || 20}px`,
            `font-weight:${Number(t.weight) || 400}`,
            `letter-spacing:${cssLetterSpacing}`
          ].join(";");
          return `
      <article class="type-card">
        <div class="type-header">
          <div class="name">${escapeHtml(t.name)}</div>
          <div class="spec">${escapeHtml(
            `${t.family} / ${t.weight} / ${t.size}px / ${t.lineHeight}px / ls ${viewLetterSpacing}`
          )}</div>
        </div>
        <p class="sample" style="${style}">Съешь же ещё этих мягких французских булок, да выпей чаю.</p>
      </article>
    `;
        })
        .join("");
      return `
      <section class="group">
        <h3 class="group-title">${escapeHtml(groupName)} (${items.length})</h3>
        <div class="types">${rows}</div>
      </section>
    `;
    })
    .join("");
}

function getEffectGroupName(token) {
  const category = String(token.category || "").trim();
  if (category === "blur-tint") return "Blur Tint";
  if (category === "background-blur") return "Background Blur";
  if (category === "layer-blur") return "Layer Blur";
  if (category === "drop-shadow") return "Shadows";
  if (category === "glass") return "Glass";
  if (category) return category;
  const top = String(token.name || "").split("/")[0].trim();
  return top || "Other";
}

function renderEffectSections(groupedEffects) {
  const entries = Array.from(groupedEffects.entries());
  if (entries.length === 0) return `<div class="effect-empty">No effect tokens loaded yet.</div>`;
  return entries
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([groupName, items]) => {
      const cards = items
        .sort((a, b) => String(a.name).localeCompare(String(b.name)))
        .map((effect) => {
          const previewStyle = getEffectPreviewStyle(effect);
          const valueText = getEffectValueText(effect);
          return `
      <article class="effect-card">
        <div class="effect-preview">
          <div class="effect-demo" style="${previewStyle}"></div>
        </div>
        <div class="effect-meta">
          <div class="effect-name">${escapeHtml(effect.name || "Unnamed effect")}</div>
          <div class="effect-value">${escapeHtml(valueText)}</div>
          ${effect.note ? `<div class="effect-note">${escapeHtml(effect.note)}</div>` : ""}
        </div>
      </article>
    `;
        })
        .join("");
      return `
      <section class="group">
        <h3 class="group-title">${escapeHtml(groupName)} (${items.length})</h3>
        <div class="effects">${cards}</div>
      </section>
    `;
    })
    .join("");
}

function getEffectPreviewStyle(effect) {
  const category = String(effect.category || "").toLowerCase();
  const effectMeta = effect.effect || {};
  if (category === "background-blur") {
    const radius = Number(effectMeta.radius) || 0;
    const uiBlur = Math.max(4, Math.min(18, Math.round(radius / 10)));
    return [
      "background:rgba(242,245,248,0.65)",
      "border:1px solid rgba(210,216,222,0.9)",
      `backdrop-filter:blur(${uiBlur}px)`,
      `-webkit-backdrop-filter:blur(${uiBlur}px)`
    ].join(";");
  }
  if (category === "layer-blur") {
    const radius = Number(effectMeta.radius) || 0;
    const uiBlur = Math.max(4, Math.min(20, Math.round(radius / 20)));
    return [
      "background:radial-gradient(circle at 20% 35%, #39AA5D 0 26px, transparent 30px), radial-gradient(circle at 75% 50%, #2CF36B 0 24px, transparent 30px), #f3f7f4",
      `filter:blur(${uiBlur}px)`
    ].join(";");
  }
  if (category.includes("blur") && typeof effect.value === "string") {
    return `background:${effect.value};backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);`;
  }
  if (category.includes("glass")) {
    const radius = Number(effectMeta.radius) || 4;
    return [
      "background:rgba(255,255,255,0.45)",
      "border:1px solid rgba(255,255,255,0.75)",
      `backdrop-filter:blur(${Math.max(8, radius * 4)}px)`,
      `-webkit-backdrop-filter:blur(${Math.max(8, radius * 4)}px)`,
      "box-shadow:0 8px 24px rgba(11,32,63,0.12)"
    ].join(";");
  }
  if (category.includes("shadow")) {
    const cssShadow = effect.cssBoxShadow || "0px 8px 20px rgba(11,32,63,0.2)";
    return `background:#ffffff;box-shadow:${cssShadow};`;
  }
  return "background:#ffffff;";
}

function getEffectValueText(effect) {
  const category = String(effect.category || "").toLowerCase();
  const effectMeta = effect.effect || {};
  if (category === "background-blur") return `BACKGROUND_BLUR / radius ${effectMeta.radius}`;
  if (category === "layer-blur") return `FOREGROUND_BLUR / radius ${effectMeta.radius}`;
  if (category === "glass") return `GLASS / radius ${effectMeta.radius}`;
  if (category === "drop-shadow" && Array.isArray(effectMeta.layers)) {
    return effectMeta.layers.map((l, i) => `L${i + 1}: (${l.offsetX},${l.offsetY}) r${l.radius} s${l.spread} ${l.color}`).join(" | ");
  }
  if (effect.value === null || effect.value === undefined || effect.value === "") return "pending";
  return String(effect.value);
}

function getIconGroupName(icon) {
  const name = String(icon.name || "").toLowerCase();
  if (name.includes("arrow") || name.includes("chevron")) return "Navigation";
  if (name.includes("check") || name.includes("cross") || name.includes("plus") || name.includes("minus") || name.includes("alert") || name.includes("info")) return "Status";
  if (
    name.includes("download") ||
    name.includes("copy") ||
    name.includes("trash") ||
    name.includes("edit") ||
    name.includes("undo") ||
    name.includes("replay") ||
    name.includes("sync") ||
    name.includes("history") ||
    name.includes("link") ||
    name.includes("magnifier") ||
    name.includes("file-type")
  ) return "Actions";
  if (
    name.includes("google") ||
    name.includes("yandex") ||
    name.includes("my-target") ||
    name.includes("mindbox") ||
    name.includes("telegram") ||
    name.includes("octopus")
  ) return "Brands";
  return "Entities";
}

function renderIconSections(groupedIcons, colorLookupLocal) {
  const entries = Array.from(groupedIcons.entries());
  if (entries.length === 0) return `<div class="effect-empty">No icons loaded yet.</div>`;
  return entries
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([groupName, items]) => {
      const cards = items
        .sort((a, b) => String(a.name).localeCompare(String(b.name)))
        .map((icon) => {
          const tokens = Array.isArray(icon.colorTokens) ? icon.colorTokens : [];
          const tokenChips = tokens
            .map((tokenName) => {
              const value = colorLookupLocal.get(String(tokenName).toLowerCase()) || "#d2d8de";
              return `<span class="token-chip"><span class="token-dot" style="background:${value}"></span>${escapeHtml(tokenName)}</span>`;
            })
            .join("");
          const sizeText = `${icon.width || 24}x${icon.height || 24}`;
          const demoContent = icon.assetUrl ? `<img src="${escapeHtml(icon.assetUrl)}" alt="${escapeHtml(icon.name || "icon")}" />` : escapeHtml(getIconMonogram(icon.name));
          return `
      <article class="icon-card">
        <div class="icon-demo">${demoContent}</div>
        <div class="icon-name">${escapeHtml(icon.name || "unnamed")}</div>
        <div class="icon-meta">node: ${escapeHtml(icon.nodeId || "-")} | size: ${escapeHtml(sizeText)}</div>
        <div class="icon-meta">color mode: <code>currentColor</code></div>
        <div class="token-chips">${tokenChips}</div>
      </article>
    `;
        })
        .join("");
      return `
      <section class="group">
        <h3 class="group-title">${escapeHtml(groupName)} (${items.length})</h3>
        <div class="icons">${cards}</div>
      </section>
    `;
    })
    .join("");
}

function getIconMonogram(name) {
  const parts = String(name || "")
    .replace(/[^a-zA-Z0-9 -]/g, "")
    .split(/[\s-]+/)
    .filter(Boolean);
  if (parts.length === 0) return "•";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

function renderButtonsPage({ catalog, typoLookup: tLookup, colorLookup: cLookup, iconLookup: iLookup }) {
  const sizes = catalog.sizes || [];
  const filledTypes = catalog.filledTypes || [];
  const linkTypes = catalog.linkTypes || [];
  const roundingModes = catalog.roundingModes || [];
  const contentVariants = catalog.contentVariants || [];
  if (!sizes.length) return `<section class="section"><div class="effect-empty">No button data.</div></section>`;

  const filledCards = renderButtonCards({
    id: "buttons-filled",
    title: "BG=true",
    description: "Фоновые кнопки по size/type. Hover: hover tokens. Active: scale 0.98.",
    sizes,
    types: filledTypes,
    mode: "filled",
    roundingMode: roundingModes.find((r) => r.id === "rounded") || { radiusKey: "radiusRounded", id: "rounded" },
    contentVariant: contentVariants.find((v) => v.id === "text") || { id: "text", hoverArrow: true },
    tLookup,
    cLookup,
    iLookup
  });

  const linkCards = renderButtonCards({
    id: "buttons-link",
    title: "BG=false",
    description: "Ссылочный режим без подчеркивания, с hover-color и active-scale.",
    sizes,
    types: linkTypes,
    mode: "link",
    roundingMode: roundingModes.find((r) => r.id === "sharp") || { radiusKey: "radiusSharp", id: "sharp" },
    contentVariant: contentVariants.find((v) => v.id === "text") || { id: "text", hoverArrow: true },
    tLookup,
    cLookup,
    iLookup
  });

  const roundingCards = roundingModes
    .map((roundingMode) =>
      renderButtonCards({
        id: roundingMode.id === "rounded" ? "buttons-rounded" : "",
        title: `Rounding: ${roundingMode.label}`,
        description: "Сравнение rounded=true/false на одном type и всех sizes.",
        sizes,
        types: [filledTypes[0]].filter(Boolean),
        mode: "filled",
        roundingMode,
        contentVariant: contentVariants.find((v) => v.id === "text") || { id: "text", hoverArrow: true },
        tLookup,
        cLookup,
        iLookup
      })
    )
    .join("");

  const contentCards = contentVariants
    .map((contentVariant, idx) => {
      const baseId = idx === 0 ? "buttons-content" : "";
      const types = [filledTypes[0], filledTypes[4], filledTypes[6]].filter(Boolean);
      if (contentVariant.id === "icon-only") {
        const roundedMode = roundingModes.find((r) => r.id === "rounded") || { radiusKey: "radiusRounded", id: "rounded", label: "Rounded=true" };
        const sharpMode = roundingModes.find((r) => r.id === "sharp") || { radiusKey: "radiusSharp", id: "sharp", label: "Rounded=false" };
        return `
          ${renderButtonCards({
            id: baseId,
            title: `Content: ${contentVariant.label} / ${roundedMode.label}`,
            description: "Варианты содержимого: text, icon-left, icon-right, icon-only.",
            sizes,
            types,
            mode: "filled",
            roundingMode: roundedMode,
            contentVariant,
            tLookup,
            cLookup,
            iLookup
          })}
          ${renderButtonCards({
            id: "",
            title: `Content: ${contentVariant.label} / ${sharpMode.label}`,
            description: "Варианты содержимого: text, icon-left, icon-right, icon-only.",
            sizes,
            types,
            mode: "filled",
            roundingMode: sharpMode,
            contentVariant,
            tLookup,
            cLookup,
            iLookup
          })}
        `;
      }
      return renderButtonCards({
        id: baseId,
        title: `Content: ${contentVariant.label}`,
        description: "Варианты содержимого: text, icon-left, icon-right, icon-only.",
        sizes,
        types,
        mode: "filled",
        roundingMode: roundingModes.find((r) => r.id === "rounded") || { radiusKey: "radiusRounded", id: "rounded" },
        contentVariant,
        tLookup,
        cLookup,
        iLookup
      });
    })
    .join("");

  const contentCardsLink = contentVariants
    .map((contentVariant, idx) =>
      renderButtonCards({
        id: idx === 0 ? "buttons-content-link" : "",
        title: `Content BG=false: ${contentVariant.label}`,
        description: "BG=false варианты содержимого для всех типов (text, icon-left, icon-right, icon-only).",
        sizes,
        types: linkTypes,
        mode: "link",
        roundingMode: roundingModes.find((r) => r.id === "sharp") || { radiusKey: "radiusSharp", id: "sharp", label: "Rounded=false" },
        contentVariant,
        tLookup,
        cLookup,
        iLookup
      })
    )
    .join("");

  return `
    <section class="section">${filledCards}</section>
    <section class="section">${linkCards}</section>
    <section class="section">${roundingCards}</section>
    <section class="section">${contentCards}</section>
    <section class="section">${contentCardsLink}</section>
  `;
}

function renderButtonCards({ id, title, description, sizes, types, mode, roundingMode, contentVariant, tLookup, cLookup, iLookup }) {
  if (!types.length) return "";
  const cards = sizes
    .map((size) => {
      const demos = types
        .map((type) => {
          const rawTypeName = String(type.name || "");
          const isNightType =
            /night/i.test(rawTypeName) ||
            rawTypeName.trim().toLowerCase() === "white";
          const sample = renderButtonVariant({
            size,
            type,
            mode,
            roundingMode,
            contentVariant,
            theme: isNightType ? "dark" : "light",
            tLookup,
            cLookup,
            iLookup
          });
          const demoClass = isNightType ? "btn-demo dark-sample" : "btn-demo";
          return `
            <div>
              <div class="btn-demo-label">${escapeHtml(type.name)}</div>
              <div class="${demoClass}">${sample}</div>
            </div>
          `;
        })
        .join("");
      return `
        <article class="btn-card">
          <div class="btn-card-head">
            <span><strong>${escapeHtml(size.name)}</strong></span>
            <span>${escapeHtml(mode)} / ${escapeHtml(roundingMode.label)} / ${escapeHtml(contentVariant.label)}</span>
          </div>
          <div class="btn-row">${demos}</div>
        </article>
      `;
    })
    .join("");
  const idAttr = id ? ` id="${escapeHtml(id)}"` : "";
  return `
    <div${idAttr}>
      <h2>${escapeHtml(title)}</h2>
      <p class="hint">${escapeHtml(description)}</p>
      <div class="btn-grid">${cards}</div>
    </div>
  `;
}

function renderButtonVariant({ size, type, mode, roundingMode, contentVariant, theme, tLookup, cLookup, iLookup }) {
  const textToken = mode === "filled" ? size.buttonTextToken : size.linkTextToken;
  const typoToken = tLookup.get(String(textToken || "").toLowerCase()) || null;
  const typoStyle = typoToken ? typographyToCss(typoToken) : "";

  const linkHoverBgToken = mode === "link" ? resolveLinkHoverBgToken(type.name) : "";
  const bgToken = mode === "link" ? "" : type.bgToken;
  const bgHoverToken = mode === "link" ? linkHoverBgToken : type.hoverBgToken || type.bgToken;
  const bgBase = getColor(cLookup, bgToken, "transparent");
  const bgHoverBase = getColor(cLookup, bgHoverToken, bgBase);
  const textBase = getColor(cLookup, type.textToken, theme === "dark" ? "#FFFFFF" : "#292B32");
  const textHoverBase = getColor(cLookup, type.hoverTextToken || type.textToken, textBase);
  const bgOpacity = mode === "link" ? undefined : type.bgOpacity;
  const bgHoverOpacity = mode === "link" ? (type.hoverBgOpacity ?? 0.14) : type.bgOpacity;
  const bg = applyOpacity(bgBase, bgOpacity);
  const bgHover = applyOpacity(bgHoverBase, bgHoverOpacity);
  const color = applyOpacity(textBase, type.textOpacity);
  const colorHover = applyOpacity(textHoverBase, type.hoverTextOpacity ?? type.textOpacity);

  const isIconOnly = !!contentVariant.iconOnly;
  const metrics = getButtonMetrics({ size: size.name, mode, rounded: roundingMode.id === "rounded", iconOnly: isIconOnly });
  const hasAnyIcon = !!(contentVariant.leftIcon || contentVariant.rightIcon || isIconOnly);
  const iconSize = hasAnyIcon ? getRenderIconSize(size.name, isIconOnly, mode) : metrics.iconSize;
  const effectivePadX = !hasAnyIcon ? getTextOnlyPadX(size.name, mode) : metrics.padX;
  const h = `${metrics.height}px`;
  const padX = `${effectivePadX}px`;
  const padYTop = `${metrics.padYTop}px`;
  const padYBottom = `${metrics.padYBottom}px`;
  const radius = metrics.radius;
  const gap = `${metrics.gap}px`;
  const iconShift = `${hasAnyIcon ? 0 : metrics.iconShift}px`;
  const classes = ["ds-btn", mode, type.isDisabled ? "is-disabled" : ""].filter(Boolean).join(" ");

  const leftIcon = contentVariant.leftIcon ? renderIconHtml(contentVariant.leftIcon, iLookup) : "";
  const rightIcon = contentVariant.rightIcon ? renderIconHtml(contentVariant.rightIcon, iLookup) : "";
  const label = isIconOnly ? "" : "<span>Button</span>";
  const body = `${leftIcon}${label}${rightIcon}`;
  const blur = type.backdropBlur ? `${Number(type.backdropBlur) || 0}px` : "0px";

  return `<button class="${classes}" style="--btn-bg:${bg};--btn-bg-hover:${bgHover};--btn-color:${color};--btn-color-hover:${colorHover};--btn-h:${h};--btn-pad-x:${padX};--btn-pad-y-top:${padYTop};--btn-pad-y-bottom:${padYBottom};--btn-radius:${radius}px;--btn-gap:${gap};--btn-icon-size:${iconSize}px;--btn-icon-shift:${iconShift};--btn-backdrop-blur:${blur};--btn-link-hover-pad-x:${!hasAnyIcon ? getTextOnlyPadX(size.name, mode) : (metrics.linkHoverPadX || metrics.padX)}px;--btn-link-hover-radius:${metrics.linkHoverRadius || metrics.radius}px;padding-top:${padYTop};padding-bottom:${padYBottom};${typoStyle}">${body}</button>`;
}

function typographyToCss(token) {
  const lsRaw = Number(token.letterSpacing) || 0;
  const lsUnit = token.letterSpacingUnit || "percent";
  return [
    `font-family:'${cssEscape(token.family || "CoFo Sans Variable")}',sans-serif`,
    `font-size:${Number(token.size) || 16}px`,
    `line-height:${Number(token.lineHeight) || 20}px`,
    `font-weight:${Number(token.weight) || 400}`,
    `letter-spacing:${toCssLetterSpacing(lsRaw, lsUnit)}`
  ].join(";");
}

function getColor(lookup, tokenName, fallback) {
  if (!tokenName) return fallback;
  return lookup.get(String(tokenName).toLowerCase()) || fallback;
}

function renderIconHtml(name, iconLookupMap) {
  const key = String(name || "").toLowerCase();
  const icon = iconLookupMap.get(key);
  if (icon?.assetUrl) {
    return `<span class="icon-static"><span class="icon-mask" style="--icon-mask:url('${escapeHtml(icon.assetUrl)}')"></span></span>`;
  }
  if (key.includes("check")) return `<span class="icon-static">${escapeHtml("✓")}</span>`;
  if (key.includes("download")) return `<span class="icon-static">${escapeHtml("↓")}</span>`;
  if (key.includes("plus")) return `<span class="icon-static">${escapeHtml("+")}</span>`;
  return `<span class="icon-static">${escapeHtml("•")}</span>`;
}

function applyOpacity(color, opacity) {
  if (opacity === undefined || opacity === null) return color;
  const parsed = parseHexColor(color);
  if (!parsed) return color;
  return `rgba(${parsed.r},${parsed.g},${parsed.b},${clamp01(Number(opacity))})`;
}

function parseHexColor(value) {
  const raw = String(value || "").trim();
  const hex = raw.startsWith("#") ? raw.slice(1) : raw;
  if (/^[A-Fa-f0-9]{6}$/.test(hex)) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      a: 1
    };
  }
  if (/^[A-Fa-f0-9]{8}$/.test(hex)) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      a: parseInt(hex.slice(6, 8), 16) / 255
    };
  }
  return null;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 1));
}

function getButtonMetrics({ size, mode, rounded, iconOnly }) {
  const bySize = {
    XL: {
      filledText: { height: 78, padX: 40, padYTop: 23, padYBottom: 25, gap: 12, iconSize: 28, iconShift: 0, radius: 10 },
      filledIconSharp: { height: 78, padX: 25, padYTop: 25, padYBottom: 25, gap: 0, iconSize: 28, iconShift: 0, radius: 10 },
      filledIconRound: { height: 76, padX: 22, padYTop: 22, padYBottom: 22, gap: 0, iconSize: 32, iconShift: 0, radius: 100 },
      linkText: { height: 44, padX: 0, padYTop: 6, padYBottom: 8, gap: 10, iconSize: 24, iconShift: 2, radius: 10 },
      linkIcon: { height: 56, padX: 0, padYTop: 12, padYBottom: 12, gap: 0, iconSize: 32, iconShift: 0, radius: 100 }
    },
    L: {
      filledText: { height: 66, padX: 32, padYTop: 19, padYBottom: 21, gap: 10, iconSize: 24, iconShift: 2, radius: 8 },
      filledIconSharp: { height: 66, padX: 21, padYTop: 21, padYBottom: 21, gap: 0, iconSize: 24, iconShift: 0, radius: 8 },
      filledIconRound: { height: 64, padX: 18, padYTop: 18, padYBottom: 18, gap: 0, iconSize: 28, iconShift: 0, radius: 100 },
      linkText: { height: 40, padX: 0, padYTop: 6, padYBottom: 6, gap: 6, iconSize: 20, iconShift: 1, radius: 8 },
      linkIcon: { height: 44, padX: 0, padYTop: 8, padYBottom: 8, gap: 0, iconSize: 28, iconShift: 0, radius: 100 }
    },
    M: {
      filledText: { height: 54, padX: 28, padYTop: 15, padYBottom: 15, gap: 8, iconSize: 20, iconShift: 1, radius: 6 },
      filledIconSharp: { height: 54, padX: 17, padYTop: 17, padYBottom: 17, gap: 0, iconSize: 20, iconShift: 0, radius: 6 },
      filledIconRound: { height: 48, padX: 12, padYTop: 12, padYBottom: 12, gap: 0, iconSize: 24, iconShift: 0, radius: 100 },
      linkText: { height: 32, padX: 0, padYTop: 4, padYBottom: 4, gap: 4, iconSize: 18, iconShift: 1, radius: 6 },
      linkIcon: { height: 36, padX: 0, padYTop: 6, padYBottom: 6, gap: 0, iconSize: 24, iconShift: 0, radius: 100 }
    },
    S: {
      filledText: { height: 46, padX: 24, padYTop: 12, padYBottom: 12, gap: 8, iconSize: 18, iconShift: 1, radius: 4 },
      filledIconSharp: { height: 46, padX: 14, padYTop: 14, padYBottom: 14, gap: 0, iconSize: 18, iconShift: 0, radius: 4 },
      filledIconRound: { height: 40, padX: 10, padYTop: 10, padYBottom: 10, gap: 0, iconSize: 20, iconShift: 0, radius: 100 },
      linkText: { height: 28, padX: 0, padYTop: 3, padYBottom: 5, gap: 4, iconSize: 16, iconShift: 1, radius: 4 },
      linkIcon: { height: 32, padX: 0, padYTop: 6, padYBottom: 6, gap: 0, iconSize: 20, iconShift: 0, radius: 100 }
    },
    XS: {
      filledText: { height: 36, padX: 16, padYTop: 7, padYBottom: 9, gap: 6, iconSize: 16, iconShift: 2, radius: 4 },
      filledIconSharp: { height: 36, padX: 10, padYTop: 10, padYBottom: 10, gap: 0, iconSize: 16, iconShift: 0, radius: 4 },
      filledIconRound: { height: 28, padX: 6, padYTop: 6, padYBottom: 6, gap: 0, iconSize: 16, iconShift: 0, radius: 100 },
      linkText: { height: 24, padX: 0, padYTop: 1, padYBottom: 3, gap: 3, iconSize: 14, iconShift: 2, radius: 4 },
      linkIcon: { height: 24, padX: 0, padYTop: 4, padYBottom: 4, gap: 0, iconSize: 16, iconShift: 0, radius: 100 }
    },
    XXS: {
      filledText: { height: 28, padX: 12, padYTop: 6, padYBottom: 6, gap: 4, iconSize: 14, iconShift: 1, radius: 4 },
      filledIconSharp: { height: 28, padX: 7, padYTop: 7, padYBottom: 7, gap: 0, iconSize: 14, iconShift: 0, radius: 4 },
      filledIconRound: { height: 20, padX: 4, padYTop: 4, padYBottom: 4, gap: 0, iconSize: 12, iconShift: 0, radius: 100 },
      linkText: { height: 18, padX: 0, padYTop: 0, padYBottom: 2, gap: 2, iconSize: 12, iconShift: 1, radius: 4 },
      linkIcon: { height: 18, padX: 0, padYTop: 2, padYBottom: 2, gap: 0, iconSize: 14, iconShift: 0, radius: 100 }
    }
  };
  const sizeSet = bySize[size] || bySize.M;
  if (mode === "filled" && iconOnly) {
    const selected = rounded ? sizeSet.filledIconRound : sizeSet.filledIconSharp;
    return { ...selected, linkHoverPadX: selected.padX, linkHoverRadius: selected.radius };
  }
  if (mode === "filled") {
    return { ...sizeSet.filledText, linkHoverPadX: sizeSet.filledText.padX, linkHoverRadius: sizeSet.filledText.radius };
  }
  if (mode === "link" && iconOnly) {
    return { ...sizeSet.linkIcon, linkHoverPadX: sizeSet.filledIconSharp.padX, linkHoverRadius: sizeSet.filledIconSharp.radius };
  }
  return { ...sizeSet.linkText, linkHoverPadX: sizeSet.filledText.padX, linkHoverRadius: sizeSet.filledText.radius };
}

function resolveLinkHoverBgToken(typeName) {
  const key = String(typeName || "").trim().toLowerCase();
  if (key === "primary" || key === "primary night") return "BG/Button/Hover/Green";
  if (key === "black") return "BG/Button/Hover/Black";
  if (key === "white") return "BG/Button/White";
  if (key === "secondary") return "BG/Button/Hover/Secondary";
  if (key === "secondary night") return "BG/Button/Hover/Secondary – Night";
  if (key === "success") return "BG/Highlight/Green 4";
  if (key === "success night") return "BG/Green 2";
  return "";
}

function buildButtonConstructorData({ catalog, typoLookup: tLookup, colorLookup: cLookup, iconLookup: iLookup }) {
  const sizes = catalog.sizes || [];
  const contentVariants = catalog.contentVariants || [];
  const roundingModes = catalog.roundingModes || [];
  const modes = ["filled", "link"];
  const typesByMode = {
    filled: catalog.filledTypes || [],
    link: catalog.linkTypes || []
  };
  const items = [];

  for (const mode of modes) {
    for (const type of typesByMode[mode]) {
      for (const size of sizes) {
        for (const contentVariant of contentVariants) {
          for (const roundingMode of roundingModes) {
            const recommendedTheme = /night/i.test(String(type.name || "")) || String(type.name || "").toLowerCase() === "white" ? "dark" : "light";
            const lightHtml = renderButtonVariant({
              size,
              type,
              mode,
              roundingMode,
              contentVariant,
              theme: "light",
              tLookup,
              cLookup,
              iLookup
            });
            const darkHtml = renderButtonVariant({
              size,
              type,
              mode,
              roundingMode,
              contentVariant,
              theme: "dark",
              tLookup,
              cLookup,
              iLookup
            });
            const textToken = mode === "filled" ? size.buttonTextToken : size.linkTextToken;
            const metrics = getButtonMetrics({
              size: size.name,
              mode,
              rounded: roundingMode.id === "rounded",
              iconOnly: !!contentVariant.iconOnly
            });
            const hasAnyIcon = !!(contentVariant.leftIcon || contentVariant.rightIcon || contentVariant.iconOnly);
            const iconSize = hasAnyIcon ? getRenderIconSize(size.name, !!contentVariant.iconOnly, mode) : 0;
            const padX = hasAnyIcon ? metrics.padX : getTextOnlyPadX(size.name, mode);
            const linkHoverBgToken = mode === "link" ? resolveLinkHoverBgToken(type.name) : "";
            const hoverBgToken = mode === "link" ? linkHoverBgToken : (type.hoverBgToken || type.bgToken || "");

            const details = [
              `Mode: ${mode}`,
              `Type: ${type.name}`,
              `Size: ${size.name}`,
              `Content: ${contentVariant.label}`,
              `Rounded: ${roundingMode.label}`,
              `Theme sample: ${recommendedTheme}`,
              `Typography token: ${textToken || "-"}`,
              `Text token: ${type.textToken || "-"}`,
              `Text hover token: ${type.hoverTextToken || "-"}`,
              `BG token: ${mode === "link" ? "-" : (type.bgToken || "-")}`,
              `BG hover token: ${hoverBgToken || "-"}`,
              `Text opacity: ${type.textOpacity ?? 1}`,
              `Text hover opacity: ${type.hoverTextOpacity ?? type.textOpacity ?? 1}`,
              `Hover bg opacity: ${mode === "link" ? (type.hoverBgOpacity ?? 0.14) : (type.bgOpacity ?? 1)}`,
              `Height: ${metrics.height}px`,
              `Padding X: ${padX}px`,
              `Padding Y: ${metrics.padYTop}px / ${metrics.padYBottom}px`,
              `Radius: ${metrics.radius}px`,
              `Gap: ${metrics.gap}px`,
              `Icon: ${hasAnyIcon ? `${contentVariant.leftIcon || contentVariant.rightIcon || "icon-only"} (${iconSize}px)` : "none"}`,
              `Backdrop blur: ${type.backdropBlur || 0}px`
            ].join("\n");

            items.push({
              mode,
              type: type.name,
              size: size.name,
              content: contentVariant.id,
              rounded: roundingMode.id,
              recommendedTheme,
              htmlByTheme: { light: lightHtml, dark: darkHtml },
              details
            });
          }
        }
      }
    }
  }

  return {
    modes,
    sizes: sizes.map((s) => s.name),
    contents: contentVariants.map((v) => ({ id: v.id, label: v.label })),
    roundedModes: roundingModes.map((r) => ({ id: r.id, label: r.label })),
    typesByMode: {
      filled: typesByMode.filled.map((t) => ({ name: t.name })),
      link: typesByMode.link.map((t) => ({ name: t.name }))
    },
    items
  };
}

function getTextOnlyPadX(sizeName, mode) {
  const bySizeFilled = { XL: 28, L: 24, M: 20, S: 16, XS: 12, XXS: 10 };
  const bySizeLinkHover = { XL: 28, L: 24, M: 20, S: 16, XS: 12, XXS: 10 };
  const key = String(sizeName || "M").toUpperCase();
  if (mode === "link") return bySizeLinkHover[key] || bySizeLinkHover.M;
  return bySizeFilled[key] || bySizeFilled.M;
}

function getRenderIconSize(sizeName, isIconOnly, mode) {
  const textIcon = { XL: 20, L: 18, M: 16, S: 14, XS: 12, XXS: 10 };
  const onlyIconFilled = { XL: 32, L: 28, M: 24, S: 20, XS: 16, XXS: 12 };
  const onlyIconLink = { XL: 32, L: 28, M: 24, S: 20, XS: 16, XXS: 14 };
  const key = String(sizeName || "M").toUpperCase();
  if (!isIconOnly) return textIcon[key] || textIcon.M;
  if (mode === "link") return onlyIconLink[key] || onlyIconLink.M;
  return onlyIconFilled[key] || onlyIconFilled.M;
}
