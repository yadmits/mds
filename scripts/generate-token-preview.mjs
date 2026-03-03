import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const tokensPath = path.join(root, "knowledge-base", "tokens", "tokens.catalog.json");
const iconsPath = path.join(root, "knowledge-base", "icons", "icons.catalog.json");
const buttonsPath = path.join(root, "knowledge-base", "components", "buttons.catalog.json");
const badgesPath = path.join(root, "knowledge-base", "components", "badges.catalog.json");
const checkboxesPath = path.join(root, "knowledge-base", "components", "checkboxes.catalog.json");
const switchersPath = path.join(root, "knowledge-base", "components", "switchers.catalog.json");
const radiosPath = path.join(root, "knowledge-base", "components", "radios.catalog.json");
const fontSourceDir = path.join(root, "knowledge-base", "assets", "fonts");
const outDir = path.join(root, "preview");
const outPath = path.join(outDir, "tokens.html");
const outFontDir = path.join(outDir, "assets", "fonts");

const catalog = JSON.parse(fs.readFileSync(tokensPath, "utf8"));
const iconsCatalog = fs.existsSync(iconsPath) ? JSON.parse(fs.readFileSync(iconsPath, "utf8")) : { icons: [] };
const buttonsCatalog = fs.existsSync(buttonsPath)
  ? JSON.parse(fs.readFileSync(buttonsPath, "utf8"))
  : { sizes: [], filledTypes: [], linkTypes: [] };
const badgesCatalog = fs.existsSync(badgesPath)
  ? JSON.parse(fs.readFileSync(badgesPath, "utf8"))
  : { sizes: [], styleVariants: [], contentVariants: [], colorOptions: [] };
const checkboxesCatalog = fs.existsSync(checkboxesPath)
  ? JSON.parse(fs.readFileSync(checkboxesPath, "utf8"))
  : { sizes: [], states: [], filledModes: [], nightModes: [] };
const switchersCatalog = fs.existsSync(switchersPath)
  ? JSON.parse(fs.readFileSync(switchersPath, "utf8"))
  : { sizes: [], states: [], filledModes: [], nightModes: [] };
const radiosCatalog = fs.existsSync(radiosPath)
  ? JSON.parse(fs.readFileSync(radiosPath, "utf8"))
  : { sizes: [], states: [], filledModes: [] };

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
const badgesSections = renderBadgesPage({
  catalog: badgesCatalog,
  typoLookup,
  colorLookup,
  iconLookup
});
const controlsSections = renderControlsPage({
  checkboxesCatalog,
  switchersCatalog,
  radiosCatalog,
  colorLookup
});
const buttonConstructorData = buildButtonConstructorData({
  catalog: buttonsCatalog,
  typoLookup,
  colorLookup,
  iconLookup
});
const badgeConstructorData = buildBadgeConstructorData({
  catalog: badgesCatalog,
  typoLookup,
  colorLookup,
  iconLookup
});
const controlsConstructorData = buildControlsConstructorData({
  checkboxesCatalog,
  switchersCatalog,
  radiosCatalog,
  colorLookup
});

const uiBg = getColor(colorLookup, "BG/Light 1", "#F0F3F6");
const uiBgSoft = getColor(colorLookup, "BG/Light 2", "#E8EBEE");
const uiPanel = getColor(colorLookup, "BG/Light 0", "#FFFFFF");
const uiInk = getColor(colorLookup, "Text/Primary", "#292B32");
const uiMuted = getColor(colorLookup, "Text/Secondary", "#0B203F");
const uiBorderBase = getColor(colorLookup, "Text/Line Secondary", "#0B203F");
const uiBorderStrongBase = getColor(colorLookup, "Text/Line Primary", "#0B203F");
const uiBorder = applyOpacity(uiBorderBase, 0.25);
const uiBorderStrong = applyOpacity(uiBorderStrongBase, 0.35);
const uiAccent = getColor(colorLookup, "Text/Primary Green", "#39AA5D");
const uiAccentSoft = getColor(colorLookup, "BG/Highlight/Green 2", "#D0F1CF");
const uiLink = getColor(colorLookup, "Link/Primary", "#268644");

const uiBgDark = getColor(colorLookup, "BG/Dark 3", "#212329");
const uiPanelDark = getColor(colorLookup, "BG/Dark 2", "#292B32");
const uiInkDark = getColor(colorLookup, "Text/Primary – Night", "#FFFFFF");
const uiMutedDark = getColor(colorLookup, "Text/Secondary – Night", "rgba(255,255,255,0.8)");
const uiBorderDarkBase = getColor(colorLookup, "Text/Line Secondary – Night", "#FFFFFF");
const uiBorderStrongDarkBase = getColor(colorLookup, "Text/Line Primary – Night", "#FFFFFF");
const uiBorderDark = applyOpacity(uiBorderDarkBase, 0.28);
const uiBorderStrongDark = applyOpacity(uiBorderStrongDarkBase, 0.45);
const uiAccentDark = getColor(colorLookup, "Text/Primary Green – Night", "#56D67F");

const uiBodyText = getTypographyCssToken(typoLookup, "S", "font-size:16px;line-height:22px;font-weight:400;letter-spacing:-0.01em");
const uiTitleText = getTypographyCssToken(typoLookup, "H3", "font-size:32px;line-height:32px;font-weight:480;letter-spacing:-0.04em");
const uiSectionTitleText = getTypographyCssToken(typoLookup, "M – Med", "font-size:18px;line-height:24px;font-weight:500;letter-spacing:-0.02em");
const uiGroupTitleText = getTypographyCssToken(typoLookup, "S – Med", "font-size:16px;line-height:22px;font-weight:500;letter-spacing:-0.02em");
const uiMetaText = getTypographyCssToken(typoLookup, "XS – Med", "font-size:14px;line-height:20px;font-weight:500;letter-spacing:-0.01em");
const uiTinyText = getTypographyCssToken(typoLookup, "XXS – Med", "font-size:12px;line-height:16px;font-weight:500;letter-spacing:0");

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
      --bg: ${uiBg};
      --bg-soft: ${uiBgSoft};
      --panel: ${uiPanel};
      --ink: ${uiInk};
      --muted: ${uiMuted};
      --border: ${uiBorder};
      --border-strong: ${uiBorderStrong};
      --accent: ${uiAccent};
      --link: ${uiLink};
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
        radial-gradient(1200px 560px at 0% -10%, ${uiAccentSoft} 0%, rgba(223, 242, 223, 0) 60%),
        linear-gradient(180deg, ${uiBgSoft} 0%, ${uiBg} 60%, ${uiBgSoft} 100%);
      color: var(--ink);
      font-family: "CoFo Sans Variable", "Helvetica Neue", Helvetica, Arial, sans-serif;
      ${uiBodyText};
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
      border-right: none;
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
      gap: 10px;
      margin-bottom: 22px;
    }
    .nav-item {
      display: grid;
      gap: 8px;
    }
    .nav-link {
      text-decoration: none;
      color: var(--sidebar-ink);
      border: none;
      border-radius: 12px;
      padding: 12px 14px;
      font-size: 14px;
      transition: all 0.16s ease;
      display: block;
    }
    .nav-link:hover {
      color: #fff;
      background: #1f2229;
    }
    .nav-link.active {
      color: #0f1d14;
      background: var(--sidebar-active);
      border-color: transparent;
      font-weight: 600;
    }
    .subnav {
      display: grid;
      gap: 6px;
      max-height: 0;
      opacity: 0;
      overflow: auto;
      padding-right: 2px;
      pointer-events: none;
      transition: max-height 180ms ease, opacity 140ms ease;
    }
    .nav-item.active .subnav {
      max-height: 280px;
      opacity: 1;
      pointer-events: auto;
    }
    .subnav-link {
      text-decoration: none;
      color: #b7bfcd;
      font-size: 13px;
      line-height: 1.25;
      padding: 6px 10px 6px 14px;
      border-radius: 8px;
      background: transparent;
      transition: color 120ms ease, background-color 120ms ease;
    }
    .subnav-link:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.08);
    }
    .subnav-link.active {
      color: #ffffff;
      background: rgba(86, 214, 127, 0.2);
    }
    .main {
      padding: 40px 36px 132px;
    }
    .page { display: none; max-width: 1600px; }
    .page.active { display: block; }
    .header {
      background: var(--panel);
      border: none;
      border-radius: 14px;
      padding: 28px 30px;
      margin-bottom: 52px;
    }
    .header-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 18px;
    }
    .theme-toggle {
      border: none;
      background: #f8fafc;
      border-radius: 8px;
      padding: 10px 14px;
      ${uiTinyText};
      cursor: pointer;
      color: #253042;
      transition: background-color 120ms ease;
    }
    .theme-toggle:hover { background: #eef4f8; }
    .title { margin: 0 0 8px; ${uiTitleText}; }
    .subtitle { margin: 0; color: var(--muted); ${uiMetaText}; }
    .legend { margin-top: 24px; display: flex; gap: 16px; flex-wrap: wrap; }
    .chip {
      border: none;
      background: var(--bg-soft);
      border-radius: 10px;
      padding: 8px 14px;
      ${uiTinyText};
      line-height: 1;
      color: #253042;
    }
    .chip b { color: var(--accent); }
    .section {
      background: var(--panel);
      border: none;
      border-radius: 14px;
      padding: 32px;
      margin-top: 56px;
    }
    .section h2 {
      margin: 6px 8px 28px;
      ${uiSectionTitleText};
    }
    .group {
      border: none;
      border-radius: 0;
      background: transparent;
      padding: 14px 0;
      margin: 46px 0;
    }
    .group-title {
      margin: 2px 4px 18px;
      ${uiGroupTitleText};
      color: var(--ink);
    }
    .hint {
      margin: 8px 10px 30px;
      color: var(--muted);
      ${uiMetaText};
      line-height: 1.35;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 30px;
    }
    .card {
      border: none;
      border-radius: 10px;
      overflow: hidden;
      background: #fff;
    }
    .swatch { height: 84px; border-bottom: none; }
    .meta { padding: 12px; display: grid; gap: 6px; }
    .name { font-size: 12px; line-height: 1.25; font-weight: 600; }
    .value, .cat { font-size: 12px; color: var(--muted); }
    .types {
      display: grid;
      grid-template-columns: 1fr;
      gap: 30px;
    }
    .type-card {
      border: none;
      border-radius: 10px;
      padding: 18px;
      background: #fff;
    }
    .type-header { margin-bottom: 8px; }
    .type-header .name { font-size: 20px; letter-spacing: -0.03em; }
    .spec { color: var(--muted); ${uiTinyText}; line-height: 1.2; }
    .sample { margin: 0; overflow-wrap: anywhere; }
    .effects {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 30px;
    }
    .effect-card {
      border: none;
      border-radius: 10px;
      background: #fff;
      overflow: hidden;
    }
    .effect-preview {
      height: 110px;
      border-bottom: none;
      padding: 20px;
      position: relative;
      background: linear-gradient(135deg, #f7f9fb 0%, #eef3f7 100%);
    }
    .effect-demo {
      width: 88px;
      height: 56px;
      border-radius: 8px;
      background: #ffffff;
      border: none;
    }
    .effect-meta {
      padding: 12px;
      display: grid;
      gap: 6px;
    }
    .effect-name { font-size: 13px; font-weight: 600; }
    .effect-value, .effect-note {
      font-size: 12px;
      color: var(--muted);
      line-height: 1.3;
    }
    .effect-empty {
      border: none;
      border-radius: 10px;
      padding: 18px;
      ${uiMetaText};
      color: var(--muted);
      background: #fbfcfd;
    }
    .icons {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 30px;
    }
    .icon-card {
      border: none;
      border-radius: 10px;
      background: #fff;
      padding: 16px;
      display: grid;
      gap: 12px;
    }
    .icon-demo {
      height: 70px;
      border: none;
      border-radius: 8px;
      background: linear-gradient(180deg, #f6f9fc 0%, #f0f4f8 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #292b32;
      font-size: 22px;
      letter-spacing: -0.03em;
      font-weight: 500;
    }
    .icon-demo .icon-mask {
      width: 24px;
      height: 24px;
      display: inline-block;
    }
    .icon-mask {
      background-color: currentColor;
      -webkit-mask-position: center;
      -webkit-mask-size: contain;
      -webkit-mask-repeat: no-repeat;
      mask-position: center;
      mask-size: contain;
      mask-repeat: no-repeat;
      transform-origin: center;
      transform: scale(var(--icon-scale-x, 1), var(--icon-scale-y, 1));
    }
    .icon-name { font-size: 13px; font-weight: 600; line-height: 1.2; }
    .icon-meta { font-size: 12px; color: var(--muted); line-height: 1.25; }
    .token-chips {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .token-chip {
      border: none;
      border-radius: 10px;
      background: #f9fbfd;
      padding: 6px 10px;
      ${uiTinyText};
      color: #2a3445;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .token-dot {
      width: 8px;
      height: 8px;
      border-radius: 8px;
      border: 1px solid rgba(0,0,0,0.08);
      flex: 0 0 8px;
    }
    .anchor-nav {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin: 0 0 24px;
      padding: 0;
      list-style: none;
    }
    .anchor-link {
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      border: none;
      border-radius: 8px;
      padding: 8px 14px;
      ${uiTinyText};
      color: var(--ink);
      background: var(--bg-soft);
    }
    .anchor-link:hover { background: #edf4f9; }
    .constructor {
      border: none;
      border-radius: 10px;
      background: #fff;
      padding: 26px;
      margin-top: 36px;
      display: grid;
      grid-template-columns: minmax(260px, 420px) 1fr;
      gap: 24px;
    }
    .constructor-preview {
      border: none;
      border-radius: 8px;
      background: linear-gradient(180deg, #f7fafc 0%, #f2f6fa 100%);
      padding: 18px;
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
      gap: 16px;
      margin-bottom: 20px;
    }
    .constructor-controls label {
      font-size: 11px;
      color: var(--muted);
      display: grid;
      gap: 6px;
    }
    .constructor-controls select {
      border: none;
      border-radius: 6px;
      background: #fff;
      color: var(--ink);
      padding: 8px 10px;
      font-family: inherit;
      font-size: 12px;
    }
    .icon-native-select { display: none; }
    .icon-picker {
      position: relative;
    }
    .icon-picker-btn {
      width: 100%;
      border: none;
      border-radius: 6px;
      background: #fff;
      color: var(--ink);
      padding: 8px 10px;
      font-family: inherit;
      font-size: 12px;
      min-height: 32px;
      display: inline-flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      cursor: pointer;
    }
    .icon-picker-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .icon-picker-value {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }
    .icon-picker-caret {
      font-size: 10px;
      opacity: 0.7;
    }
    .icon-picker-menu {
      position: absolute;
      z-index: 30;
      inset: calc(100% + 4px) 0 auto 0;
      border: none;
      border-radius: 8px;
      background: #fff;
      box-shadow: 0 8px 24px rgba(11, 32, 63, 0.14);
      padding: 6px;
      max-height: 220px;
      overflow: auto;
      display: none;
    }
    .icon-picker.open .icon-picker-menu { display: block; }
    .icon-picker-item {
      width: 100%;
      border: 0;
      border-radius: 6px;
      background: transparent;
      padding: 6px 8px;
      text-align: left;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: #111827;
      cursor: pointer;
      font-size: 12px;
    }
    .icon-picker-item:hover {
      background: #f3f7fb;
    }
    .icon-picker-glyph {
      width: 14px;
      height: 14px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #292B32;
      flex: 0 0 14px;
    }
    .icon-picker-glyph .icon-mask {
      width: 100%;
      height: 100%;
    }
    .constructor-props {
      border: none;
      border-radius: 8px;
      background: #f9fbfd;
      padding: 14px;
      ${uiTinyText};
      line-height: 1.4;
      color: #223047;
      white-space: pre-wrap;
    }
    .btn-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 30px;
    }
    .btn-card {
      border: none;
      border-radius: 0;
      background: transparent;
      padding: 0;
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
      gap: 18px;
    }
    .btn-demo-label {
      font-size: 11px;
      color: var(--muted);
      margin-bottom: 6px;
    }
    .btn-demo {
      min-height: 74px;
      border: none;
      border-radius: 8px;
      background: linear-gradient(180deg, #f7fafc 0%, #f2f6fa 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 14px;
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
    .ds-badge {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      white-space: nowrap;
    }
    .ds-badge.fill {
      background: var(--badge-fill, #fff);
      border: 1px solid transparent;
    }
    .ds-badge.outline {
      background: transparent;
      border: var(--badge-stroke-width, 1px) solid var(--badge-stroke, #fff);
    }
    .ds-badge-icon {
      width: var(--badge-icon-size, 14px);
      height: var(--badge-icon-size, 14px);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--badge-icon-color, currentColor);
      flex: 0 0 var(--badge-icon-size, 14px);
    }
    .ds-badge .icon-mask {
      width: 100%;
      height: 100%;
    }
    .ds-badge-text-wrap {
      display: inline-flex;
      align-items: center;
      gap: var(--badge-text-gap, 8px);
      color: var(--badge-text-color, #292B32);
    }
    .ds-badge-divider {
      width: var(--badge-divider-size, 3px);
      height: var(--badge-divider-size, 3px);
      border-radius: 999px;
      background: var(--badge-divider-color, currentColor);
      opacity: var(--badge-divider-opacity, 0.6);
      flex: 0 0 var(--badge-divider-size, 3px);
    }
    .ds-badge-label {
      display: inline-block;
    }
    .controls-section {
      background: var(--panel);
      border: none;
      border-radius: 14px;
      padding: 32px;
      margin-top: 56px;
    }
    .controls-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 30px;
    }
    .control-card {
      border: none;
      border-radius: 0;
      background: transparent;
      padding: 0;
      display: grid;
      gap: 14px;
    }
    .control-card .meta {
      font-size: 12px;
      color: var(--muted);
    }
    .control-demo {
      min-height: 72px;
      border: none;
      border-radius: 8px;
      background: linear-gradient(180deg, #f7fafc 0%, #f2f6fa 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 14px;
      padding: 16px;
    }
    .control-demo.dark {
      background: linear-gradient(180deg, #2b2e35 0%, #252931 100%);
      border-color: #3b3f49;
    }
    .ds-checkbox {
      position: relative;
      flex: 0 0 auto;
      display: inline-block;
    }
    .ds-checkbox-mark {
      position: absolute;
      left: 50%;
      top: 50%;
      width: calc(var(--cb-size) * 0.52);
      height: calc(var(--cb-size) * 0.38);
      border-left: calc(var(--cb-size) * 0.12) solid var(--cb-check, #fff);
      border-bottom: calc(var(--cb-size) * 0.12) solid var(--cb-check, #fff);
      transform: translate(-50%, -58%) rotate(-45deg);
      border-radius: 1px;
      opacity: var(--cb-mark-opacity, 1);
    }
    .ds-switch {
      position: relative;
      display: inline-block;
      flex: 0 0 auto;
    }
    .ds-switch-thumb {
      position: absolute;
      top: var(--sw-pad);
      left: var(--sw-thumb-left);
      width: var(--sw-thumb-size);
      height: var(--sw-thumb-size);
      border-radius: 999px;
      background: var(--sw-thumb, #fff);
    }
    .ds-radio {
      position: relative;
      display: inline-block;
      flex: 0 0 auto;
    }
    .ds-radio-inner {
      position: absolute;
      left: 50%;
      top: 50%;
      width: var(--rd-inner);
      height: var(--rd-inner);
      transform: translate(-50%, -50%);
      border-radius: 999px;
      background: var(--rd-inner-bg, #fff);
    }
    code {
      background: #f2f5f8;
      border: none;
      border-radius: 6px;
      padding: 2px 6px;
      font-size: 11px;
    }
    body[data-theme="dark"] {
      --bg: ${uiBgDark};
      --bg-soft: color-mix(in srgb, ${uiBgDark} 70%, ${uiPanelDark} 30%);
      --panel: ${uiPanelDark};
      --ink: ${uiInkDark};
      --muted: ${uiMutedDark};
      --border: ${uiBorderDark};
      --border-strong: ${uiBorderStrongDark};
      --accent: ${uiAccentDark};
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
      background: color-mix(in srgb, var(--panel) 84%, #ffffff 16%);
      border-color: var(--border);
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
        border-bottom: none;
      }
      .nav { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .subnav { display: none; }
      .btn-grid { grid-template-columns: 1fr; }
      .controls-grid { grid-template-columns: 1fr; }
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
        <div class="nav-item" data-nav-item="tokens">
          <a class="nav-link" data-nav="tokens" href="#tokens">Tokens</a>
          <nav class="subnav" data-subnav="tokens"></nav>
        </div>
        <div class="nav-item" data-nav-item="buttons">
          <a class="nav-link" data-nav="buttons" href="#buttons">Buttons</a>
          <nav class="subnav" data-subnav="buttons"></nav>
        </div>
        <div class="nav-item" data-nav-item="badges">
          <a class="nav-link" data-nav="badges" href="#badges">Badges</a>
          <nav class="subnav" data-subnav="badges"></nav>
        </div>
        <div class="nav-item" data-nav-item="controls">
          <a class="nav-link" data-nav="controls" href="#controls">Controls</a>
          <nav class="subnav" data-subnav="controls"></nav>
        </div>
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

        <section id="tokens-colors" class="section" data-toc-item="Colors">
          <h2>Colors (${colors.length})</h2>
          ${colorSections}
        </section>

        <section id="tokens-typography" class="section" data-toc-item="Typography">
          <h2>Typography (${typo.length})</h2>
          ${typoSections}
        </section>

        <section id="tokens-effects" class="section" data-toc-item="Effects">
          <h2>Effects (${effects.length})</h2>
          ${effectSections}
        </section>

        <section id="tokens-icons" class="section" data-toc-item="Icons">
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
                <label>Left Icon
                  <select class="icon-native-select" data-ctrl="leftIcon"></select>
                </label>
                <label>Right Icon
                  <select class="icon-native-select" data-ctrl="rightIcon"></select>
                </label>
              </div>
              <div class="constructor-props" data-constructor-props>Loading...</div>
            </div>
          </section>
        </header>

        ${buttonsSections}
      </section>

      <section class="page" data-page="badges">
        <header class="header">
          <div class="header-row">
            <div>
              <h1 class="title">Badges</h1>
              <p class="subtitle">Figma source node: <code>3480:5323</code> | Optional parts: left icon, right icon, text2 | Styles: <code>filled</code> / <code>outline</code>.</p>
            </div>
            <button class="theme-toggle" type="button" data-theme-toggle>Theme: Light</button>
          </div>
          <ul class="anchor-nav">
            <li><a class="anchor-link" href="#badges-constructor">Constructor</a></li>
            <li><a class="anchor-link" href="#badges-filled">Filled</a></li>
            <li><a class="anchor-link" href="#badges-outline">Outline</a></li>
            <li><a class="anchor-link" href="#badges-content">Parts</a></li>
          </ul>
          <section id="badges-constructor" class="constructor" data-badge-constructor>
            <div class="constructor-preview" data-badge-constructor-preview></div>
            <div>
              <div class="constructor-controls">
                <label>Style
                  <select data-badge-ctrl="style"></select>
                </label>
                <label>Size
                  <select data-badge-ctrl="size"></select>
                </label>
                <label>Device
                  <select data-badge-ctrl="device"></select>
                </label>
                <label>Parts
                  <select data-badge-ctrl="content"></select>
                </label>
                <label>Text Color
                  <select data-badge-ctrl="textColor"></select>
                </label>
                <label>Theme
                  <select data-badge-ctrl="theme"></select>
                </label>
                <label>Fill / Stroke
                  <select data-badge-ctrl="containerColor"></select>
                </label>
                <label>Divider Color
                  <select data-badge-ctrl="dividerColor"></select>
                </label>
                <label>Left Icon
                  <select class="icon-native-select" data-badge-ctrl="leftIcon"></select>
                </label>
                <label>Right Icon
                  <select class="icon-native-select" data-badge-ctrl="rightIcon"></select>
                </label>
              </div>
              <div class="constructor-props" data-badge-constructor-props>Loading...</div>
            </div>
          </section>
        </header>

        ${badgesSections}
      </section>

      <section class="page" data-page="controls">
        <header class="header">
          <div class="header-row">
            <div>
              <h1 class="title">Controls</h1>
              <p class="subtitle">Checkboxes, Switchers, Radio Buttons from the global DS library.</p>
            </div>
            <button class="theme-toggle" type="button" data-theme-toggle>Theme: Light</button>
          </div>
          <ul class="anchor-nav">
            <li><a class="anchor-link" href="#controls-checkboxes">Checkboxes</a></li>
            <li><a class="anchor-link" href="#controls-switchers">Switchers</a></li>
            <li><a class="anchor-link" href="#controls-radios">Radios</a></li>
          </ul>
        </header>
        ${controlsSections}
      </section>
    </main>
  </div>
  <script>
    const BUTTON_CONSTRUCTOR_DATA = ${JSON.stringify(buttonConstructorData)};
    const BADGE_CONSTRUCTOR_DATA = ${JSON.stringify(badgeConstructorData)};
    const CONTROLS_CONSTRUCTOR_DATA = ${JSON.stringify(controlsConstructorData)};
    (function () {
      const nav = Array.from(document.querySelectorAll("[data-nav]"));
      const navItems = Array.from(document.querySelectorAll("[data-nav-item]"));
      const pages = Array.from(document.querySelectorAll("[data-page]"));
      const themeButtons = Array.from(document.querySelectorAll("[data-theme-toggle]"));
      let subnavState = { page: "", ids: [] };
      let scrollTicking = false;

      function resolvePage() {
        const raw = window.location.hash.replace("#", "").trim();
        if (raw === "buttons" || raw.startsWith("buttons-")) return "buttons";
        if (raw === "badges" || raw.startsWith("badges-")) return "badges";
        if (raw === "controls" || raw.startsWith("controls-")) return "controls";
        return "tokens";
      }

      function render() {
        const page = resolvePage();
        pages.forEach((el) => el.classList.toggle("active", el.dataset.page === page));
        nav.forEach((el) => el.classList.toggle("active", el.dataset.nav === page));
        navItems.forEach((el) => el.classList.toggle("active", el.dataset.navItem === page));
        buildSidebarSubnav(page);
      }

      function stripCountLabel(text) {
        return String(text || "").replace(/\s*\(\d+\)\s*$/, "").trim();
      }

      function collectTocItems(pageEl) {
        const anchorLinks = Array.from(pageEl.querySelectorAll(".anchor-nav a[href^='#']"));
        if (anchorLinks.length) {
          return anchorLinks
            .map((a) => {
              const href = a.getAttribute("href") || "";
              const id = href.startsWith("#") ? href.slice(1) : "";
              return {
                id,
                label: (a.textContent || "").trim()
              };
            })
            .filter((x) => x.id);
        }

        return Array.from(pageEl.querySelectorAll("[data-toc-item][id]")).map((el) => ({
          id: el.id,
          label: (el.getAttribute("data-toc-item") || stripCountLabel(el.querySelector("h2")?.textContent || el.id)).trim()
        }));
      }

      function setActiveSubnavLink(id) {
        const page = subnavState.page;
        if (!page) return;
        const slot = document.querySelector('[data-subnav="' + page + '"]');
        if (!slot) return;
        const links = Array.from(slot.querySelectorAll(".subnav-link"));
        links.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === "#" + id));
      }

      function updateActiveSectionByScroll() {
        const ids = subnavState.ids || [];
        if (!ids.length) return;
        const offset = 170;
        let lastPassed = "";
        let firstFuture = "";
        for (const id of ids) {
          const el = document.getElementById(id);
          if (!el || el.offsetParent === null) continue;
          const top = el.getBoundingClientRect().top;
          if (top <= offset) {
            lastPassed = id;
          } else if (!firstFuture) {
            firstFuture = id;
          }
        }
        const activeId = lastPassed || firstFuture || ids[0];
        if (activeId) setActiveSubnavLink(activeId);
      }

      function scheduleActiveSectionUpdate() {
        if (scrollTicking) return;
        scrollTicking = true;
        requestAnimationFrame(() => {
          scrollTicking = false;
          updateActiveSectionByScroll();
        });
      }

      function buildSidebarSubnav(page) {
        const slots = Array.from(document.querySelectorAll("[data-subnav]"));
        slots.forEach((slot) => (slot.innerHTML = ""));
        const currentPage = pages.find((el) => el.classList.contains("active"));
        if (!currentPage) {
          subnavState = { page: "", ids: [] };
          return;
        }
        const items = collectTocItems(currentPage);
        const slot = document.querySelector('[data-subnav="' + page + '"]');
        if (!slot) {
          subnavState = { page: "", ids: [] };
          return;
        }
        if (!items.length) {
          subnavState = { page: "", ids: [] };
          return;
        }
        slot.innerHTML = items
          .map((item) => '<a class="subnav-link" href="#' + item.id + '">' + item.label + "</a>")
          .join("");
        subnavState = { page, ids: items.map((item) => item.id) };
        scheduleActiveSectionUpdate();
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

      function setupIconPicker(select, iconMap) {
        if (!select) return { sync: () => {} };
        const label = select.closest("label");
        if (!label) return { sync: () => {} };

        if (label.querySelector(".icon-picker")) {
          return {
            sync: () => {
              const btn = label.querySelector(".icon-picker-btn");
              if (btn) btn.disabled = !!select.disabled;
            }
          };
        }

        const picker = document.createElement("div");
        picker.className = "icon-picker";
        const trigger = document.createElement("button");
        trigger.type = "button";
        trigger.className = "icon-picker-btn";
        trigger.innerHTML = '<span class="icon-picker-value"></span><span class="icon-picker-caret">▾</span>';
        const menu = document.createElement("div");
        menu.className = "icon-picker-menu";
        picker.append(trigger, menu);
        label.appendChild(picker);

        function renderGlyph(value) {
          if (value === "none") return '<span class="icon-picker-glyph">∅</span>';
          if (value === "default") return '<span class="icon-picker-glyph">Auto</span>';
          const meta = iconMap[String(value || "").toLowerCase()];
          if (!meta || !meta.url) return '<span class="icon-picker-glyph">•</span>';
          const sx = Number(meta.scaleX) || 1;
          const sy = Number(meta.scaleY) || 1;
          return '<span class="icon-picker-glyph"><span class="icon-mask" style="-webkit-mask-image:url(\\'' + meta.url + '\\');mask-image:url(\\'' + meta.url + '\\');--icon-scale-x:' + sx + ';--icon-scale-y:' + sy + '"></span></span>';
        }

        function renderOptions() {
          menu.innerHTML = "";
          const values = Array.from(select.options).map((opt) => ({ value: opt.value, label: opt.textContent || opt.value }));
          const validValues = new Set(values.map((v) => v.value));
          if (!validValues.has(select.value) && values[0]) select.value = values[0].value;
          for (const item of values) {
            const optionBtn = document.createElement("button");
            optionBtn.type = "button";
            optionBtn.className = "icon-picker-item";
            optionBtn.innerHTML = renderGlyph(item.value) + "<span>" + item.label + "</span>";
            optionBtn.addEventListener("click", () => {
              select.value = item.value;
              select.dispatchEvent(new Event("change", { bubbles: true }));
              picker.classList.remove("open");
              updateTrigger();
            });
            menu.appendChild(optionBtn);
          }
          updateTrigger();
        }

        function updateTrigger() {
          const selected = Array.from(select.options).find((o) => o.value === select.value) || select.options[0];
          const value = selected?.value || "none";
          const labelText = selected?.textContent || value;
          const valueEl = trigger.querySelector(".icon-picker-value");
          if (valueEl) valueEl.innerHTML = renderGlyph(value) + "<span>" + labelText + "</span>";
          trigger.disabled = !!select.disabled;
        }

        trigger.addEventListener("click", () => {
          if (select.disabled) return;
          picker.classList.toggle("open");
        });

        document.addEventListener("click", (event) => {
          if (!picker.contains(event.target)) picker.classList.remove("open");
        });

        select.addEventListener("change", updateTrigger);
        renderOptions();
        return {
          sync: () => {
            renderOptions();
            updateTrigger();
          }
        };
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
        const ctrlLeftIcon = root.querySelector('[data-ctrl="leftIcon"]');
        const ctrlRightIcon = root.querySelector('[data-ctrl="rightIcon"]');

        const controls = [ctrlMode, ctrlType, ctrlSize, ctrlContent, ctrlRounded, ctrlTheme, ctrlLeftIcon, ctrlRightIcon].filter(Boolean);
        if (controls.length !== 8) return;

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
        setOptions(ctrlLeftIcon, [{ value: "default", label: "Default" }, { value: "none", label: "None" }, ...BUTTON_CONSTRUCTOR_DATA.icons.map((v) => ({ value: v, label: v }))]);
        setOptions(ctrlRightIcon, [{ value: "default", label: "Default" }, { value: "none", label: "None" }, ...BUTTON_CONSTRUCTOR_DATA.icons.map((v) => ({ value: v, label: v }))]);
        const leftPicker = setupIconPicker(ctrlLeftIcon, BUTTON_CONSTRUCTOR_DATA.iconMetaByName || {});
        const rightPicker = setupIconPicker(ctrlRightIcon, BUTTON_CONSTRUCTOR_DATA.iconMetaByName || {});

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
          const leftIconChoice = item.hasLeftIcon || item.isIconOnly ? (ctrlLeftIcon.value || "default") : "none";
          const rightIconChoice = item.hasRightIcon ? (ctrlRightIcon.value || "default") : "none";
          ctrlLeftIcon.disabled = !(item.hasLeftIcon || item.isIconOnly);
          ctrlRightIcon.disabled = !item.hasRightIcon;
          if (ctrlLeftIcon.disabled) ctrlLeftIcon.value = "none";
          if (ctrlRightIcon.disabled) ctrlRightIcon.value = "none";
          leftPicker.sync();
          rightPicker.sync();
          applyButtonConstructorIcons(preview, item, leftIconChoice, rightIconChoice);
          props.textContent = item.details;
        }

        function applyButtonConstructorIcons(container, item, leftChoice, rightChoice) {
          const slots = Array.from(container.querySelectorAll("[data-icon-slot]"));
          const iconMap = BUTTON_CONSTRUCTOR_DATA.iconMetaByName || {};
          for (const slotEl of slots) {
            const slot = slotEl.getAttribute("data-icon-slot") || "left";
            const defaultName = slotEl.getAttribute("data-icon-default") || (slot === "right" ? item.defaultRightIcon : item.defaultLeftIcon) || "";
            const selected = slot === "right" ? rightChoice : leftChoice;
            const iconName = selected === "default" ? defaultName : selected;
            if (!iconName || iconName === "none") {
              slotEl.style.display = "none";
              continue;
            }
            slotEl.style.display = "";
            const meta = iconMap[String(iconName).toLowerCase()];
            if (meta && meta.url) {
              const sx = Number(meta.scaleX) || 1;
              const sy = Number(meta.scaleY) || 1;
              slotEl.innerHTML = '<span class="icon-mask" style="-webkit-mask-image:url(\\'' + meta.url + '\\');mask-image:url(\\'' + meta.url + '\\');--icon-scale-x:' + sx + ';--icon-scale-y:' + sy + '"></span>';
            } else {
              slotEl.textContent = "•";
            }
          }
        }

        ctrlMode.addEventListener("change", () => {
          syncTypeOptions();
          renderCtor();
        });
        [ctrlType, ctrlSize, ctrlContent, ctrlRounded, ctrlTheme, ctrlLeftIcon, ctrlRightIcon].forEach((el) => el.addEventListener("change", renderCtor));

        ctrlMode.value = "filled";
        syncTypeOptions();
        ctrlType.value = "Primary";
        ctrlSize.value = "M";
        ctrlContent.value = "text";
        ctrlRounded.value = "rounded";
        ctrlTheme.value = "auto";
        ctrlLeftIcon.value = "default";
        ctrlRightIcon.value = "default";
        renderCtor();
      }

      function initBadgeConstructor() {
        const root = document.querySelector("[data-badge-constructor]");
        if (!root || !BADGE_CONSTRUCTOR_DATA || !Array.isArray(BADGE_CONSTRUCTOR_DATA.items)) return;
        const preview = root.querySelector("[data-badge-constructor-preview]");
        const props = root.querySelector("[data-badge-constructor-props]");
        const ctrlStyle = root.querySelector('[data-badge-ctrl="style"]');
        const ctrlSize = root.querySelector('[data-badge-ctrl="size"]');
        const ctrlDevice = root.querySelector('[data-badge-ctrl="device"]');
        const ctrlContent = root.querySelector('[data-badge-ctrl="content"]');
        const ctrlTextColor = root.querySelector('[data-badge-ctrl="textColor"]');
        const ctrlContainerColor = root.querySelector('[data-badge-ctrl="containerColor"]');
        const ctrlDividerColor = root.querySelector('[data-badge-ctrl="dividerColor"]');
        const ctrlTheme = root.querySelector('[data-badge-ctrl="theme"]');
        const ctrlLeftIcon = root.querySelector('[data-badge-ctrl="leftIcon"]');
        const ctrlRightIcon = root.querySelector('[data-badge-ctrl="rightIcon"]');

        const controls = [ctrlStyle, ctrlSize, ctrlDevice, ctrlContent, ctrlTextColor, ctrlContainerColor, ctrlDividerColor, ctrlTheme, ctrlLeftIcon, ctrlRightIcon].filter(Boolean);
        if (controls.length !== 10) return;

        function setOptions(select, values) {
          select.innerHTML = values.map((v) => '<option value="' + v.value + '">' + v.label + '</option>').join("");
        }

        setOptions(ctrlStyle, BADGE_CONSTRUCTOR_DATA.styles.map((v) => ({ value: v.id, label: v.label })));
        setOptions(ctrlSize, BADGE_CONSTRUCTOR_DATA.sizes.map((v) => ({ value: v, label: v })));
        setOptions(ctrlDevice, BADGE_CONSTRUCTOR_DATA.devices.map((v) => ({ value: v.id, label: v.label })));
        setOptions(ctrlContent, BADGE_CONSTRUCTOR_DATA.contents.map((v) => ({ value: v.id, label: v.label })));
        setOptions(ctrlTextColor, BADGE_CONSTRUCTOR_DATA.colorTokens.map((v) => ({ value: v, label: v })));
        setOptions(ctrlContainerColor, BADGE_CONSTRUCTOR_DATA.colorTokens.map((v) => ({ value: v, label: v })));
        setOptions(ctrlDividerColor, BADGE_CONSTRUCTOR_DATA.colorTokens.map((v) => ({ value: v, label: v })));
        setOptions(ctrlLeftIcon, [{ value: "default", label: "Default" }, { value: "none", label: "None" }, ...BADGE_CONSTRUCTOR_DATA.icons.map((v) => ({ value: v, label: v }))]);
        setOptions(ctrlRightIcon, [{ value: "default", label: "Default" }, { value: "none", label: "None" }, ...BADGE_CONSTRUCTOR_DATA.icons.map((v) => ({ value: v, label: v }))]);
        const leftPicker = setupIconPicker(ctrlLeftIcon, BADGE_CONSTRUCTOR_DATA.iconMetaByName || {});
        const rightPicker = setupIconPicker(ctrlRightIcon, BADGE_CONSTRUCTOR_DATA.iconMetaByName || {});
        setOptions(ctrlTheme, [
          { value: "auto", label: "Auto" },
          { value: "light", label: "Light sample" },
          { value: "dark", label: "Dark sample" }
        ]);

        function syncColorDefaults() {
          const style = ctrlStyle.value;
          const styleMeta = BADGE_CONSTRUCTOR_DATA.styles.find((x) => x.id === style) || BADGE_CONSTRUCTOR_DATA.styles[0];
          if (!styleMeta) return;
          ctrlTextColor.value = styleMeta.defaultTextToken || ctrlTextColor.value;
          ctrlDividerColor.value = styleMeta.defaultDividerToken || ctrlDividerColor.value;
          ctrlContainerColor.value = style === "outline"
            ? (styleMeta.defaultStrokeToken || ctrlContainerColor.value)
            : (styleMeta.defaultFillToken || ctrlContainerColor.value);
        }

        function renderCtor() {
          const style = ctrlStyle.value;
          const size = ctrlSize.value;
          const device = ctrlDevice.value;
          const content = ctrlContent.value;
          const textColor = ctrlTextColor.value;
          const containerColor = ctrlContainerColor.value;
          const dividerColor = ctrlDividerColor.value;
          const leftIcon = ctrlLeftIcon.value;
          const rightIcon = ctrlRightIcon.value;
          const selectedTheme = ctrlTheme.value;

          const item = BADGE_CONSTRUCTOR_DATA.items.find((x) =>
            x.style === style &&
            x.size === size &&
            x.device === device &&
            x.content === content
          );
          if (!item) return;

          const effectiveTheme = selectedTheme === "auto" ? item.recommendedTheme : selectedTheme;
          preview.classList.toggle("dark", effectiveTheme === "dark");
          ctrlLeftIcon.disabled = !item.leftIcon;
          ctrlRightIcon.disabled = !item.rightIcon;
          if (ctrlLeftIcon.disabled) ctrlLeftIcon.value = "none";
          if (ctrlRightIcon.disabled) ctrlRightIcon.value = "none";
          leftPicker.sync();
          rightPicker.sync();
          preview.innerHTML = renderBadgeFromItem(item, {
            textColor,
            containerColor,
            dividerColor,
            leftIcon,
            rightIcon
          });
          props.textContent = getBadgeDetails(item, {
            textColor,
            containerColor,
            dividerColor,
            leftIcon,
            rightIcon,
            theme: effectiveTheme
          });
        }

        function renderBadgeFromItem(item, colors) {
          function iconMarkup(iconName) {
            const resolved = iconName === "default" ? item.defaultIconName : iconName;
            const meta = BADGE_CONSTRUCTOR_DATA.iconMetaByName[String(resolved || "").toLowerCase()];
            if (meta && meta.url) {
              const sx = Number(meta.scaleX) || 1;
              const sy = Number(meta.scaleY) || 1;
              return '<span class="icon-mask" style="-webkit-mask-image:url(\\'' + meta.url + '\\');mask-image:url(\\'' + meta.url + '\\');--icon-scale-x:' + sx + ';--icon-scale-y:' + sy + '"></span>';
            }
            return "•";
          }
          const leftIconName = colors.leftIcon || "default";
          const rightIconName = colors.rightIcon || "default";
          const leftIcon = item.leftIcon && leftIconName !== "none" ? '<span class="ds-badge-icon">' + iconMarkup(leftIconName) + '</span>' : "";
          const rightIcon = item.rightIcon && rightIconName !== "none" ? '<span class="ds-badge-icon">' + iconMarkup(rightIconName) + '</span>' : "";
          const secondText = item.text2
            ? '<span class="ds-badge-divider"></span><span class="ds-badge-label">' + item.textSecondary + '</span>'
            : "";
          const styleCss = [
            '--badge-fill:' + item.bgColor,
            '--badge-stroke:' + item.strokeColor,
            '--badge-stroke-width:' + item.strokeWidth + 'px',
            '--badge-text-color:' + item.textColor,
            '--badge-divider-color:' + item.dividerColor,
            '--badge-icon-color:' + item.textColor,
            '--badge-icon-size:' + item.iconSize + 'px',
            '--badge-text-gap:' + item.textGap + 'px',
            '--badge-divider-size:' + item.dividerSize + 'px',
            'gap:' + item.outerGap + 'px',
            'padding-left:' + item.paddingX + 'px',
            'padding-right:' + item.paddingX + 'px',
            'padding-top:' + item.paddingTop + 'px',
            'padding-bottom:' + item.paddingBottom + 'px',
            'font-family:"' + item.fontFamily + '",sans-serif',
            'font-size:' + item.fontSize + 'px',
            'line-height:' + item.lineHeight + 'px',
            'font-weight:' + item.fontWeight,
            'letter-spacing:' + item.letterSpacing
          ];
          styleCss[0] = '--badge-fill:' + (item.style === 'fill' ? item.containerColorValue[colors.containerColor] || item.bgColor : 'transparent');
          styleCss[1] = '--badge-stroke:' + (item.style === 'outline' ? item.containerColorValue[colors.containerColor] || item.strokeColor : item.strokeColor);
          styleCss[3] = '--badge-text-color:' + (item.containerColorValue[colors.textColor] || item.textColor);
          styleCss[4] = '--badge-divider-color:' + (item.containerColorValue[colors.dividerColor] || item.dividerColor);
          styleCss[5] = '--badge-icon-color:' + (item.containerColorValue[colors.textColor] || item.textColor);

          return '<div class="ds-badge ' + item.style + '" style="' + styleCss.join(';') + '">' +
            leftIcon +
            '<span class="ds-badge-text-wrap"><span class="ds-badge-label">' + item.textPrimary + '</span>' + secondText + '</span>' +
            rightIcon +
            '</div>';
        }

        function getBadgeDetails(item, info) {
          return [
            'Style: ' + item.style,
            'Size: ' + item.size,
            'Device: ' + item.device,
            'Parts: ' + item.contentLabel,
            'Typography token: ' + item.textToken,
            'Text color token: ' + info.textColor,
            'Divider color token: ' + info.dividerColor,
            (item.style === 'fill' ? 'Fill color token: ' : 'Stroke color token: ') + info.containerColor,
            'Left icon: ' + (item.leftIcon ? info.leftIcon : "none"),
            'Right icon: ' + (item.rightIcon ? info.rightIcon : "none"),
            'Theme sample: ' + info.theme,
            'Padding X: ' + item.paddingX + 'px',
            'Padding Y: ' + item.paddingTop + 'px / ' + item.paddingBottom + 'px',
            'Outer gap: ' + item.outerGap + 'px',
            'Text gap: ' + item.textGap + 'px',
            'Icon size: ' + item.iconSize + 'px',
            'Divider size: ' + item.dividerSize + 'px',
            'Border width (outline): ' + item.strokeWidth + 'px'
          ].join('\\n');
        }

        ctrlStyle.addEventListener("change", () => {
          syncColorDefaults();
          renderCtor();
        });
        [ctrlSize, ctrlDevice, ctrlContent, ctrlTextColor, ctrlContainerColor, ctrlDividerColor, ctrlTheme, ctrlLeftIcon, ctrlRightIcon].forEach((el) => el.addEventListener("change", renderCtor));

        ctrlStyle.value = "fill";
        ctrlSize.value = "M";
        ctrlDevice.value = "desktop";
        ctrlContent.value = "full";
        syncColorDefaults();
        ctrlTheme.value = "auto";
        ctrlLeftIcon.value = "default";
        ctrlRightIcon.value = "default";
        renderCtor();
      }

      function initControlsConstructors() {
        if (!CONTROLS_CONSTRUCTOR_DATA) return;

        function renderCheckboxMarkup(opts) {
          const size = Number(opts.size.box) || 20;
          const radius = Number(opts.size.radius) || 5;
          const showMark = !!opts.filled;
          return '<span class="ds-checkbox" style="width:' + size + 'px;height:' + size + 'px;border-radius:' + radius + 'px;background:' + opts.bg + ';border:' + (opts.borderWidth || 0) + 'px solid ' + opts.border + ';--cb-size:' + size + 'px;--cb-check:' + opts.check + ';--cb-mark-opacity:' + (showMark ? 1 : 0) + '"><span class="ds-checkbox-mark"></span></span>';
        }

        function renderSwitchMarkup(opts) {
          const s = opts.size;
          return '<span class="ds-switch" style="width:' + s.trackW + 'px;height:' + s.trackH + 'px;border-radius:999px;background:' + opts.track + ';--sw-pad:' + s.pad + 'px;--sw-thumb-size:' + s.thumb + 'px;--sw-thumb-left:' + opts.thumbLeft + 'px;--sw-thumb:' + opts.thumb + '"><span class="ds-switch-thumb"></span></span>';
        }

        function renderRadioMarkup(opts) {
          const s = opts.size;
          return '<span class="ds-radio" style="width:' + s.box + 'px;height:' + s.box + 'px;border-radius:999px;background:' + opts.outer + ';--rd-inner:' + s.inner + 'px;--rd-inner-bg:' + opts.inner + '"><span class="ds-radio-inner"></span></span>';
        }

        const checkboxRoot = document.querySelector('[data-control-constructor="checkboxes"]');
        if (checkboxRoot) {
          const preview = checkboxRoot.querySelector("[data-control-preview]");
          const props = checkboxRoot.querySelector("[data-control-props]");
          const cSize = checkboxRoot.querySelector('[data-ctrl="size"]');
          const cState = checkboxRoot.querySelector('[data-ctrl="state"]');
          const cFilled = checkboxRoot.querySelector('[data-ctrl="filled"]');
          const cNight = checkboxRoot.querySelector('[data-ctrl="night"]');
          const data = CONTROLS_CONSTRUCTOR_DATA.checkboxes;
          if (preview && props && cSize && cState && cFilled && cNight && data) {
            cSize.innerHTML = data.sizes.map((s) => '<option value="' + s.id + '">' + s.id + '</option>').join("");
            cState.innerHTML = data.states.map((s) => '<option value="' + s + '">' + s + '</option>').join("");
            cFilled.innerHTML = '<option value="true">Filled=true</option><option value="false">Filled=false</option>';
            cNight.innerHTML = '<option value="false">Night=false</option><option value="true">Night=true</option>';
            cSize.value = data.defaultSize;
            cState.value = data.defaultState;
            cFilled.value = String(data.defaultFilled);
            cNight.value = String(data.defaultNight);

            const render = () => {
              const size = data.sizes.find((s) => s.id === cSize.value) || data.sizes[0];
              const state = cState.value;
              const filled = cFilled.value === "true";
              const night = cNight.value === "true";
              const style = data.palette[String(filled)][String(night)][state] || data.palette[String(filled)][String(night)].Default;
              preview.classList.toggle("dark", night);
              preview.innerHTML = renderCheckboxMarkup({ size, filled, bg: style.bg, border: style.border, borderWidth: style.borderWidth, check: style.check });
              props.textContent = [
                "Component: Checkbox",
                "Size: " + size.id,
                "State: " + state,
                "Filled: " + filled,
                "Night: " + night,
                "Background: " + style.bg,
                "Border: " + style.border
              ].join("\\n");
            };
            [cSize, cState, cFilled, cNight].forEach((el) => el.addEventListener("change", render));
            render();
          }
        }

        const switchRoot = document.querySelector('[data-control-constructor="switchers"]');
        if (switchRoot) {
          const preview = switchRoot.querySelector("[data-control-preview]");
          const props = switchRoot.querySelector("[data-control-props]");
          const cSize = switchRoot.querySelector('[data-ctrl="size"]');
          const cState = switchRoot.querySelector('[data-ctrl="state"]');
          const cFilled = switchRoot.querySelector('[data-ctrl="filled"]');
          const cNight = switchRoot.querySelector('[data-ctrl="night"]');
          const cOn = switchRoot.querySelector('[data-ctrl="on"]');
          const data = CONTROLS_CONSTRUCTOR_DATA.switchers;
          if (preview && props && cSize && cState && cFilled && cNight && cOn && data) {
            cSize.innerHTML = data.sizes.map((s) => '<option value="' + s.id + '">' + s.id + '</option>').join("");
            cState.innerHTML = data.states.map((s) => '<option value="' + s + '">' + s + '</option>').join("");
            cFilled.innerHTML = '<option value="true">Filled=true</option><option value="false">Filled=false</option>';
            cNight.innerHTML = '<option value="false">Night=false</option><option value="true">Night=true</option>';
            cOn.innerHTML = '<option value="true">On=true</option><option value="false">On=false</option>';
            cSize.value = data.defaultSize;
            cState.value = data.defaultState;
            cFilled.value = String(data.defaultFilled);
            cNight.value = String(data.defaultNight);
            cOn.value = String(data.defaultOn);

            const render = () => {
              const size = data.sizes.find((s) => s.id === cSize.value) || data.sizes[0];
              const state = cState.value;
              const filled = cFilled.value === "true";
              const night = cNight.value === "true";
              const on = cOn.value === "true";
              const style = data.palette[String(filled)][String(night)][state] || data.palette[String(filled)][String(night)].Default;
              preview.classList.toggle("dark", night);
              const thumbLeft = on ? (size.trackW - size.pad - size.thumb) : size.pad;
              preview.innerHTML = renderSwitchMarkup({ size, track: style.track, thumb: style.thumb, thumbLeft });
              props.textContent = [
                "Component: Switcher",
                "Size: " + size.id,
                "State: " + state,
                "Filled: " + filled,
                "Night: " + night,
                "On: " + on,
                "Track: " + style.track
              ].join("\\n");
            };
            [cSize, cState, cFilled, cNight, cOn].forEach((el) => el.addEventListener("change", render));
            render();
          }
        }

        const radioRoot = document.querySelector('[data-control-constructor="radios"]');
        if (radioRoot) {
          const preview = radioRoot.querySelector("[data-control-preview]");
          const props = radioRoot.querySelector("[data-control-props]");
          const cState = radioRoot.querySelector('[data-ctrl="state"]');
          const cFilled = radioRoot.querySelector('[data-ctrl="filled"]');
          const data = CONTROLS_CONSTRUCTOR_DATA.radios;
          if (preview && props && cState && cFilled && data) {
            cState.innerHTML = data.states.map((s) => '<option value="' + s + '">' + s + '</option>').join("");
            cFilled.innerHTML = '<option value="true">Filled=true</option><option value="false">Filled=false</option>';
            cState.value = data.defaultState;
            cFilled.value = String(data.defaultFilled);
            const render = () => {
              const size = data.sizes[0];
              const state = cState.value;
              const filled = cFilled.value === "true";
              const style = data.palette[String(filled)][state] || data.palette[String(filled)].Default;
              preview.classList.remove("dark");
              preview.innerHTML = renderRadioMarkup({ size, outer: style.outer, inner: style.inner });
              props.textContent = [
                "Component: Radio",
                "Size: " + size.id,
                "State: " + state,
                "Filled: " + filled,
                "Outer: " + style.outer
              ].join("\\n");
            };
            [cState, cFilled].forEach((el) => el.addEventListener("change", render));
            render();
          }
        }
      }

      themeButtons.forEach((btn) => btn.addEventListener("click", toggleTheme));

      const savedTheme = localStorage.getItem("mb-ds-theme");
      applyTheme(savedTheme === "dark" ? "dark" : "light");
      initButtonConstructor();
      initBadgeConstructor();
      initControlsConstructors();

      window.addEventListener("hashchange", render);
      window.addEventListener("scroll", scheduleActiveSectionUpdate, { passive: true });
      window.addEventListener("resize", scheduleActiveSectionUpdate);
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
          const demoContent = icon.assetUrl ? `<span class="icon-mask" style="${getIconMaskStyle(icon)}"></span>` : escapeHtml(getIconMonogram(icon.name));
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

  const leftIcon = contentVariant.leftIcon ? renderIconHtml(contentVariant.leftIcon, iLookup, "left") : "";
  const rightIcon = contentVariant.rightIcon ? renderIconHtml(contentVariant.rightIcon, iLookup, "right") : "";
  const label = isIconOnly ? "" : "<span>Button</span>";
  const body = `${leftIcon}${label}${rightIcon}`;
  const blur = type.backdropBlur ? `${Number(type.backdropBlur) || 0}px` : "0px";

  return `<button class="${classes}" style="--btn-bg:${bg};--btn-bg-hover:${bgHover};--btn-color:${color};--btn-color-hover:${colorHover};--btn-h:${h};--btn-pad-x:${padX};--btn-pad-y-top:${padYTop};--btn-pad-y-bottom:${padYBottom};--btn-radius:${radius}px;--btn-gap:${gap};--btn-icon-size:${iconSize}px;--btn-icon-shift:${iconShift};--btn-backdrop-blur:${blur};--btn-link-hover-pad-x:${!hasAnyIcon ? getTextOnlyPadX(size.name, mode) : (metrics.linkHoverPadX || metrics.padX)}px;--btn-link-hover-radius:${metrics.linkHoverRadius || metrics.radius}px;padding-top:${padYTop};padding-bottom:${padYBottom};${typoStyle}">${body}</button>`;
}

function renderBadgesPage({ catalog, typoLookup: tLookup, colorLookup: cLookup, iconLookup: iLookup }) {
  const styles = catalog.styleVariants || [];
  const sizes = catalog.sizes || [];
  const contents = catalog.contentVariants || [];
  if (!styles.length || !sizes.length || !contents.length) return `<section class="section"><div class="effect-empty">No badge data.</div></section>`;

  const fillStyle = styles.find((s) => s.id === "fill") || styles[0];
  const outlineStyle = styles.find((s) => s.id === "outline") || styles[0];
  const fullContent = contents.find((v) => v.id === "full") || contents[0];

  const filledCards = renderBadgeCards({
    id: "badges-filled",
    title: "Filled",
    description: "Fill style with token-driven text/divider/fill colors.",
    styles: [fillStyle],
    sizes,
    contents: [fullContent],
    devices: ["desktop", "mobile"],
    catalog,
    tLookup,
    cLookup,
    iLookup
  });

  const outlineCards = renderBadgeCards({
    id: "badges-outline",
    title: "Outline",
    description: "Outline style with token-driven text/divider/stroke colors.",
    styles: [outlineStyle],
    sizes,
    contents: [fullContent],
    devices: ["desktop", "mobile"],
    catalog,
    tLookup,
    cLookup,
    iLookup
  });

  const contentCards = renderBadgeCards({
    id: "badges-content",
    title: "Parts",
    description: "Optional parts: left icon, right icon, and second text block.",
    styles: [fillStyle, outlineStyle],
    sizes: [sizes[1] || sizes[0]],
    contents,
    devices: ["desktop"],
    catalog,
    tLookup,
    cLookup,
    iLookup
  });

  return `
    <section class="section">${filledCards}</section>
    <section class="section">${outlineCards}</section>
    <section class="section">${contentCards}</section>
  `;
}

function renderBadgeCards({ id, title, description, styles, sizes, contents, devices, catalog, tLookup, cLookup, iLookup }) {
  const cards = sizes
    .map((size) => {
      const demos = styles
        .flatMap((styleMeta) =>
          devices.flatMap((device) =>
            contents.map((content) => {
              const demo = renderBadgeVariant({
                catalog,
                styleId: styleMeta.id,
                sizeId: size.id,
                device,
                contentId: content.id,
                tLookup,
                cLookup,
                iLookup
              });
              const themeClass = styleMeta.id === "outline" ? "btn-demo dark-sample" : "btn-demo";
              return `
                <div>
                  <div class="btn-demo-label">${escapeHtml(`${styleMeta.label} / ${device} / ${content.label}`)}</div>
                  <div class="${themeClass}">${demo}</div>
                </div>
              `;
            })
          )
        )
        .join("");
      return `
        <article class="btn-card">
          <div class="btn-card-head">
            <span><strong>${escapeHtml(size.id)}</strong></span>
            <span>Badge matrix</span>
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

function renderBadgeVariant({ catalog, styleId, sizeId, device, contentId, tLookup, cLookup, iLookup, overrides = {} }) {
  const styleMeta = (catalog.styleVariants || []).find((s) => s.id === styleId) || (catalog.styleVariants || [])[0];
  const sizeMeta = (catalog.sizes || []).find((s) => s.id === sizeId) || (catalog.sizes || [])[0];
  const contentMeta = (catalog.contentVariants || []).find((c) => c.id === contentId) || (catalog.contentVariants || [])[0];
  if (!styleMeta || !sizeMeta || !contentMeta) return "";

  const metric = getBadgeMetrics(sizeMeta, device);
  const typoTokenName = metric.textToken || "XS – Med";
  const typoToken = tLookup.get(String(typoTokenName).toLowerCase()) || null;
  const typoStyle = typoToken ? typographyToCss(typoToken) : "";
  const iconName = catalog.defaultIcon || "chip";
  const icon = iLookup.get(String(iconName).toLowerCase());
  const iconHtml = icon?.assetUrl
    ? `<span class="icon-mask" style="${getIconMaskStyle(icon)}"></span>`
    : escapeHtml("•");

  const textColorToken = overrides.textColorToken || styleMeta.defaultTextToken || "Text/Primary";
  const dividerColorToken = overrides.dividerColorToken || styleMeta.defaultDividerToken || textColorToken;
  const containerColorToken = overrides.containerColorToken || (styleId === "outline" ? styleMeta.defaultStrokeToken : styleMeta.defaultFillToken) || "BG/Light 0";

  const textColor = getColor(cLookup, textColorToken, styleId === "outline" ? "#FFFFFF" : "#292B32");
  const dividerColor = getColor(cLookup, dividerColorToken, textColor);
  const containerColor = getColor(cLookup, containerColorToken, styleId === "outline" ? "#FFFFFF" : "#FFFFFF");
  const bgColor = styleId === "fill" ? containerColor : "transparent";
  const strokeColor = styleId === "outline" ? containerColor : "transparent";

  const leftIcon = contentMeta.leftIcon ? `<span class="ds-badge-icon">${iconHtml}</span>` : "";
  const rightIcon = contentMeta.rightIcon ? `<span class="ds-badge-icon">${iconHtml}</span>` : "";
  const secondText = contentMeta.text2
    ? `<span class="ds-badge-divider"></span><span class="ds-badge-label">${escapeHtml(catalog.defaultText || "Some text")}</span>`
    : "";

  const style = [
    `--badge-fill:${bgColor}`,
    `--badge-stroke:${strokeColor}`,
    `--badge-stroke-width:${Number(metric.borderWidthOutline) || 1}px`,
    `--badge-text-color:${textColor}`,
    `--badge-divider-color:${dividerColor}`,
    `--badge-icon-color:${textColor}`,
    `--badge-icon-size:${Number(metric.iconSize) || 14}px`,
    `--badge-text-gap:${Number(metric.gapText) || 8}px`,
    `--badge-divider-size:${Number(metric.dividerSize) || 3}px`,
    `gap:${Number(metric.gapOuter) || 4}px`,
    `padding-left:${Number(metric.paddingX) || 10}px`,
    `padding-right:${Number(metric.paddingX) || 10}px`,
    `padding-top:${Number(metric.paddingTop) || 4}px`,
    `padding-bottom:${Number(metric.paddingBottom) || 4}px`,
    typoStyle
  ].join(";");

  return `<div class="ds-badge ${escapeHtml(styleId)}" style="${style}">${leftIcon}<span class="ds-badge-text-wrap"><span class="ds-badge-label">${escapeHtml(catalog.defaultText || "Some text")}</span>${secondText}</span>${rightIcon}</div>`;
}

function getBadgeMetrics(sizeMeta, device) {
  const key = String(device || "desktop").toLowerCase() === "mobile" ? "mobile" : "desktop";
  return sizeMeta?.[key] || sizeMeta?.desktop || {};
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

function getTypographyCssToken(lookup, tokenName, fallback) {
  const token = lookup.get(String(tokenName || "").toLowerCase());
  return token ? typographyToCss(token) : fallback;
}

function getColor(lookup, tokenName, fallback) {
  if (!tokenName) return fallback;
  return lookup.get(String(tokenName).toLowerCase()) || fallback;
}

function getIconScale(icon) {
  const srcW = Number(icon?.sourceWidth) || Number(icon?.viewBoxWidth) || Number(icon?.width) || 24;
  const srcH = Number(icon?.sourceHeight) || Number(icon?.viewBoxHeight) || Number(icon?.height) || 24;
  if (!Number.isFinite(srcW) || !Number.isFinite(srcH) || srcW <= 0 || srcH <= 0) {
    return { scaleX: 1, scaleY: 1 };
  }
  const ratio = srcW / srcH;
  if (!Number.isFinite(ratio) || ratio <= 0) return { scaleX: 1, scaleY: 1 };
  if (ratio >= 1) {
    return { scaleX: 1, scaleY: Math.max(0.06, 1 / ratio) };
  }
  return { scaleX: Math.max(0.06, ratio), scaleY: 1 };
}

function getIconMaskStyle(icon) {
  const url = escapeHtml(icon?.assetUrl || "");
  const { scaleX, scaleY } = getIconScale(icon);
  return `-webkit-mask-image:url('${url}');mask-image:url('${url}');--icon-scale-x:${scaleX.toFixed(4)};--icon-scale-y:${scaleY.toFixed(4)}`;
}

function renderIconHtml(name, iconLookupMap, slot = "left") {
  const key = String(name || "").toLowerCase();
  const icon = iconLookupMap.get(key);
  if (icon?.assetUrl) {
    return `<span class="icon-static" data-icon-slot="${escapeHtml(slot)}" data-icon-default="${escapeHtml(name || "")}"><span class="icon-mask" style="${getIconMaskStyle(icon)}"></span></span>`;
  }
  if (key.includes("check")) return `<span class="icon-static" data-icon-slot="${escapeHtml(slot)}" data-icon-default="${escapeHtml(name || "")}">${escapeHtml("✓")}</span>`;
  if (key.includes("download")) return `<span class="icon-static" data-icon-slot="${escapeHtml(slot)}" data-icon-default="${escapeHtml(name || "")}">${escapeHtml("↓")}</span>`;
  if (key.includes("plus")) return `<span class="icon-static" data-icon-slot="${escapeHtml(slot)}" data-icon-default="${escapeHtml(name || "")}">${escapeHtml("+")}</span>`;
  return `<span class="icon-static" data-icon-slot="${escapeHtml(slot)}" data-icon-default="${escapeHtml(name || "")}">${escapeHtml("•")}</span>`;
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
  const iconEntries = Array.from(iLookup.values()).filter((icon) => icon?.assetUrl);
  const availableIcons = Array.from(new Set(iconEntries.map((icon) => String(icon.name || "").trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const iconMetaByName = Object.fromEntries(
    iconEntries.map((icon) => {
      const scale = getIconScale(icon);
      return [
        String(icon.name || "").toLowerCase(),
        {
          url: icon.assetUrl || "",
          scaleX: Number(scale.scaleX.toFixed(4)),
          scaleY: Number(scale.scaleY.toFixed(4))
        }
      ];
    })
  );
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
              hasLeftIcon: !!contentVariant.leftIcon || !!contentVariant.iconOnly,
              hasRightIcon: !!contentVariant.rightIcon,
              isIconOnly: !!contentVariant.iconOnly,
              defaultLeftIcon: contentVariant.leftIcon || "",
              defaultRightIcon: contentVariant.rightIcon || "",
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
    icons: availableIcons,
    iconMetaByName,
    typesByMode: {
      filled: typesByMode.filled.map((t) => ({ name: t.name })),
      link: typesByMode.link.map((t) => ({ name: t.name }))
    },
    items
  };
}

function buildBadgeConstructorData({ catalog, typoLookup: tLookup, colorLookup: cLookup, iconLookup: iLookup }) {
  const styles = catalog.styleVariants || [];
  const sizes = catalog.sizes || [];
  const contents = catalog.contentVariants || [];
  const colorTokens = Array.from(
    new Set(
      [
        ...(catalog.colorOptions || []),
        ...styles.map((s) => s.defaultTextToken).filter(Boolean),
        ...styles.map((s) => s.defaultDividerToken).filter(Boolean),
        ...styles.map((s) => s.defaultFillToken).filter(Boolean),
        ...styles.map((s) => s.defaultStrokeToken).filter(Boolean)
      ].filter(Boolean)
    )
  );
  const devices = [
    { id: "desktop", label: "Desktop" },
    { id: "mobile", label: "Mobile" }
  ];
  const iconEntries = Array.from(iconLookup.values()).filter((icon) => icon?.assetUrl);
  const availableIcons = Array.from(new Set(iconEntries.map((icon) => String(icon.name || "").trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const iconMetaByName = Object.fromEntries(
    iconEntries.map((icon) => {
      const scale = getIconScale(icon);
      return [
        String(icon.name || "").toLowerCase(),
        {
          url: icon.assetUrl || "",
          scaleX: Number(scale.scaleX.toFixed(4)),
          scaleY: Number(scale.scaleY.toFixed(4))
        }
      ];
    })
  );
  const items = [];
  const icon = iconLookup.get(String(catalog.defaultIcon || "chip").toLowerCase());

  for (const styleMeta of styles) {
    for (const size of sizes) {
      for (const device of devices) {
        for (const content of contents) {
          const metric = getBadgeMetrics(size, device.id);
          const typoTokenName = metric.textToken || "XS – Med";
          const typoToken = tLookup.get(String(typoTokenName).toLowerCase()) || {};
          const defaultTextToken = styleMeta.defaultTextToken || "Text/Primary";
          const defaultDividerToken = styleMeta.defaultDividerToken || defaultTextToken;
          const defaultContainerToken = styleMeta.id === "outline"
            ? (styleMeta.defaultStrokeToken || "BG/Light 0")
            : (styleMeta.defaultFillToken || "BG/Light 0");
          const recommendedTheme = styleMeta.id === "outline" ? "dark" : "light";

          items.push({
            style: styleMeta.id,
            size: size.id,
            device: device.id,
            content: content.id,
            contentLabel: content.label,
            recommendedTheme,
            textToken: typoTokenName,
            leftIcon: !!content.leftIcon,
            rightIcon: !!content.rightIcon,
            text2: !!content.text2,
            textPrimary: catalog.defaultText || "Some text",
            textSecondary: catalog.defaultText || "Some text",
            defaultIconName: catalog.defaultIcon || "chip",
            iconAssetUrl: icon?.assetUrl || "",
            iconSize: Number(metric.iconSize) || 14,
            dividerSize: Number(metric.dividerSize) || 3,
            textGap: Number(metric.gapText) || 8,
            outerGap: Number(metric.gapOuter) || 4,
            paddingX: Number(metric.paddingX) || 10,
            paddingTop: Number(metric.paddingTop) || 4,
            paddingBottom: Number(metric.paddingBottom) || 4,
            strokeWidth: Number(metric.borderWidthOutline) || 1,
            bgColor: getColor(cLookup, styleMeta.defaultFillToken, "#FFFFFF"),
            strokeColor: getColor(cLookup, styleMeta.defaultStrokeToken, "#FFFFFF"),
            textColor: getColor(cLookup, defaultTextToken, styleMeta.id === "outline" ? "#FFFFFF" : "#292B32"),
            dividerColor: getColor(cLookup, defaultDividerToken, styleMeta.id === "outline" ? "#FFFFFF" : "#7B8190"),
            defaultTextToken,
            defaultDividerToken,
            defaultContainerToken,
            containerColorValue: Object.fromEntries(colorTokens.map((token) => [token, getColor(cLookup, token, "#292B32")])),
            fontFamily: typoToken.family || "CoFo Sans Variable",
            fontSize: Number(typoToken.size) || 14,
            lineHeight: Number(typoToken.lineHeight) || 21,
            fontWeight: Number(typoToken.weight) || 500,
            letterSpacing: toCssLetterSpacing(Number(typoToken.letterSpacing) || 0, typoToken.letterSpacingUnit || "percent")
          });
        }
      }
    }
  }

  return {
    styles: styles.map((s) => ({
      id: s.id,
      label: s.label,
      defaultTextToken: s.defaultTextToken,
      defaultDividerToken: s.defaultDividerToken,
      defaultFillToken: s.defaultFillToken,
      defaultStrokeToken: s.defaultStrokeToken
    })),
    sizes: sizes.map((s) => s.id),
    devices,
    contents: contents.map((c) => ({ id: c.id, label: c.label })),
    icons: availableIcons,
    iconMetaByName,
    colorTokens,
    items
  };
}

function renderControlsPage({ checkboxesCatalog, switchersCatalog, radiosCatalog, colorLookup: cLookup }) {
  const data = buildControlsConstructorData({
    checkboxesCatalog,
    switchersCatalog,
    radiosCatalog,
    colorLookup: cLookup
  });
  return `
    <section id="controls-checkboxes" class="controls-section">
      <h2>Checkboxes</h2>
      <p class="hint">States: Default, Hovered, Inactive, Error. Variants: Filled/Empty and Night.</p>
      ${renderControlConstructor("checkboxes", ["size", "state", "filled", "night"])}
      <div class="controls-grid">${renderCheckboxCards(data.checkboxes)}</div>
    </section>
    <section id="controls-switchers" class="controls-section">
      <h2>Switchers</h2>
      <p class="hint">States: Default, Hovered, Inactive. Variants: Filled/Empty, Night and On/Off.</p>
      ${renderControlConstructor("switchers", ["size", "state", "filled", "night", "on"])}
      <div class="controls-grid">${renderSwitcherCards(data.switchers)}</div>
    </section>
    <section id="controls-radios" class="controls-section">
      <h2>Radio Buttons</h2>
      <p class="hint">States: Default, Hovered. Variants: Filled/Empty.</p>
      ${renderControlConstructor("radios", ["state", "filled"])}
      <div class="controls-grid">${renderRadioCards(data.radios)}</div>
    </section>
  `;
}

function renderControlConstructor(type, controls) {
  const labels = { size: "Size", state: "State", filled: "Filled", night: "Night", on: "On" };
  const selects = controls.map((name) => `<label>${labels[name]}<select data-ctrl="${name}"></select></label>`).join("");
  return `
    <section class="constructor" data-control-constructor="${type}">
      <div class="constructor-preview" data-control-preview></div>
      <div>
        <div class="constructor-controls">${selects}</div>
        <div class="constructor-props" data-control-props>Loading...</div>
      </div>
    </section>
  `;
}

function renderCheckboxCards(data) {
  const size = data.sizes.find((s) => s.id === data.defaultSize) || data.sizes[0];
  return data.states.map((state) => {
    const lightFilled = data.palette["true"]["false"][state] || data.palette["true"]["false"].Default;
    const lightEmpty = data.palette["false"]["false"][state] || data.palette["false"]["false"].Default;
    const nightFilled = data.palette["true"]["true"][state] || data.palette["true"]["true"].Default;
    const nightEmpty = data.palette["false"]["true"][state] || data.palette["false"]["true"].Default;
    return `
      <article class="control-card">
        <div><strong>${escapeHtml(state)}</strong></div>
        <div class="control-demo">${renderCheckboxNode(size, true, lightFilled)} ${renderCheckboxNode(size, false, lightEmpty)}</div>
        <div class="control-demo dark">${renderCheckboxNode(size, true, nightFilled)} ${renderCheckboxNode(size, false, nightEmpty)}</div>
        <div class="meta">Light: filled + empty | Dark: filled + empty</div>
      </article>
    `;
  }).join("");
}

function renderSwitcherCards(data) {
  const size = data.sizes.find((s) => s.id === data.defaultSize) || data.sizes[0];
  return data.states.map((state) => {
    const lightOn = data.palette["true"]["false"][state] || data.palette["true"]["false"].Default;
    const lightOff = data.palette["false"]["false"][state] || data.palette["false"]["false"].Default;
    const nightOn = data.palette["true"]["true"][state] || data.palette["true"]["true"].Default;
    const nightOff = data.palette["false"]["true"][state] || data.palette["false"]["true"].Default;
    return `
      <article class="control-card">
        <div><strong>${escapeHtml(state)}</strong></div>
        <div class="control-demo">${renderSwitcherNode(size, true, lightOn)} ${renderSwitcherNode(size, false, lightOff)}</div>
        <div class="control-demo dark">${renderSwitcherNode(size, true, nightOn)} ${renderSwitcherNode(size, false, nightOff)}</div>
        <div class="meta">Light: on + off | Dark: on + off</div>
      </article>
    `;
  }).join("");
}

function renderRadioCards(data) {
  const size = data.sizes[0];
  return data.states.map((state) => {
    const on = data.palette["true"][state] || data.palette["true"].Default;
    const off = data.palette["false"][state] || data.palette["false"].Default;
    return `
      <article class="control-card">
        <div><strong>${escapeHtml(state)}</strong></div>
        <div class="control-demo">${renderRadioNode(size, on)} ${renderRadioNode(size, off)}</div>
        <div class="meta">Filled + Empty</div>
      </article>
    `;
  }).join("");
}

function renderCheckboxNode(size, filled, style) {
  const box = Number(size?.box) || 20;
  const radius = Number(size?.radius) || 5;
  const borderWidth = Number(style?.borderWidth ?? 1);
  return `<span class="ds-checkbox" style="width:${box}px;height:${box}px;border-radius:${radius}px;background:${style.bg};border:${borderWidth}px solid ${style.border};--cb-size:${box}px;--cb-check:${style.check};--cb-mark-opacity:${filled ? 1 : 0}"><span class="ds-checkbox-mark"></span></span>`;
}

function renderSwitcherNode(size, on, style) {
  const trackW = Number(size?.trackW) || 38;
  const trackH = Number(size?.trackH) || 24;
  const pad = Number(size?.pad) || 3;
  const thumb = Number(size?.thumb) || 18;
  const left = on ? trackW - pad - thumb : pad;
  return `<span class="ds-switch" style="width:${trackW}px;height:${trackH}px;border-radius:999px;background:${style.track};--sw-pad:${pad}px;--sw-thumb-size:${thumb}px;--sw-thumb-left:${left}px;--sw-thumb:${style.thumb}"><span class="ds-switch-thumb"></span></span>`;
}

function renderRadioNode(size, style) {
  const box = Number(size?.box) || 20;
  const inner = Number(size?.inner) || 14;
  return `<span class="ds-radio" style="width:${box}px;height:${box}px;border-radius:999px;background:${style.outer};--rd-inner:${inner}px;--rd-inner-bg:${style.inner}"><span class="ds-radio-inner"></span></span>`;
}

function buildControlsConstructorData({ checkboxesCatalog, switchersCatalog, radiosCatalog, colorLookup: cLookup }) {
  const resolve = (value, fallback) => resolveColorReference(value, cLookup, fallback);
  const cbTokens = checkboxesCatalog.tokens || {};
  const swTokens = switchersCatalog.tokens || {};
  const rdTokens = radiosCatalog.tokens || {};

  const checkboxes = {
    sizes: checkboxesCatalog.sizes || [],
    states: checkboxesCatalog.states || [],
    defaultSize: checkboxesCatalog.defaultSize || "S",
    defaultState: checkboxesCatalog.defaultState || "Default",
    defaultFilled: checkboxesCatalog.defaultFilled ?? true,
    defaultNight: checkboxesCatalog.defaultNight ?? false,
    palette: {
      true: {
        false: {
          Default: { bg: resolve(cbTokens.fill, "#39AA5D"), border: "transparent", borderWidth: 0, check: resolve(cbTokens.check, "#FFFFFF") },
          Hovered: { bg: resolve(cbTokens.fillHover, "#268644"), border: "transparent", borderWidth: 0, check: resolve(cbTokens.check, "#FFFFFF") },
          Inactive: { bg: resolve(cbTokens.inactiveLight, "rgba(11,32,63,0.1)"), border: "transparent", borderWidth: 0, check: resolve(cbTokens.check, "#FFFFFF") },
          Error: { bg: resolve(cbTokens.fillError, "#D84258"), border: "transparent", borderWidth: 0, check: resolve(cbTokens.check, "#FFFFFF") }
        },
        true: {
          Default: { bg: resolve(cbTokens.fill, "#39AA5D"), border: "transparent", borderWidth: 0, check: resolve(cbTokens.checkNight, "#FFFFFF") },
          Hovered: { bg: resolve(cbTokens.fillHover, "#268644"), border: "transparent", borderWidth: 0, check: resolve(cbTokens.checkNight, "#FFFFFF") },
          Inactive: { bg: resolve(cbTokens.inactiveNight, "rgba(255,255,255,0.1)"), border: "transparent", borderWidth: 0, check: resolve(cbTokens.checkNight, "#FFFFFF") },
          Error: { bg: resolve(cbTokens.fillError, "#D84258"), border: "transparent", borderWidth: 0, check: resolve(cbTokens.checkNight, "#FFFFFF") }
        }
      },
      false: {
        false: {
          Default: { bg: "transparent", border: resolve(cbTokens.borderLight, "rgba(11,32,63,0.25)"), borderWidth: 1, check: "transparent" },
          Hovered: { bg: "transparent", border: resolve(cbTokens.borderLightHover, "rgba(11,32,63,0.35)"), borderWidth: 1, check: "transparent" },
          Inactive: { bg: "transparent", border: resolve(cbTokens.inactiveLight, "rgba(11,32,63,0.1)"), borderWidth: 1, check: "transparent" },
          Error: { bg: "transparent", border: resolve(cbTokens.fillError, "#D84258"), borderWidth: 1, check: "transparent" }
        },
        true: {
          Default: { bg: "transparent", border: resolve(cbTokens.borderNight, "rgba(255,255,255,0.15)"), borderWidth: 1, check: "transparent" },
          Hovered: { bg: "transparent", border: resolve(cbTokens.borderNightHover, "rgba(255,255,255,0.6)"), borderWidth: 1, check: "transparent" },
          Inactive: { bg: "transparent", border: resolve(cbTokens.inactiveNight, "rgba(255,255,255,0.1)"), borderWidth: 1, check: "transparent" },
          Error: { bg: "transparent", border: resolve(cbTokens.fillError, "#D84258"), borderWidth: 1, check: "transparent" }
        }
      }
    }
  };

  const switchers = {
    sizes: switchersCatalog.sizes || [],
    states: switchersCatalog.states || [],
    defaultSize: switchersCatalog.defaultSize || "L",
    defaultState: switchersCatalog.defaultState || "Default",
    defaultFilled: switchersCatalog.defaultFilled ?? true,
    defaultNight: switchersCatalog.defaultNight ?? false,
    defaultOn: switchersCatalog.defaultOn ?? true,
    palette: {
      true: {
        false: {
          Default: { track: resolve(swTokens.on, "#39AA5D"), thumb: resolve(swTokens.thumb, "#FFFFFF") },
          Hovered: { track: resolve(swTokens.onHover, "#268644"), thumb: resolve(swTokens.thumb, "#FFFFFF") },
          Inactive: { track: resolve(swTokens.inactiveLight, "rgba(11,32,63,0.1)"), thumb: resolve(swTokens.thumbInactive, "rgba(255,255,255,0.6)") }
        },
        true: {
          Default: { track: resolve(swTokens.on, "#39AA5D"), thumb: resolve(swTokens.thumb, "#FFFFFF") },
          Hovered: { track: resolve(swTokens.onHover, "#268644"), thumb: resolve(swTokens.thumb, "#FFFFFF") },
          Inactive: { track: resolve(swTokens.inactiveNight, "rgba(255,255,255,0.1)"), thumb: resolve(swTokens.thumbInactive, "rgba(255,255,255,0.6)") }
        }
      },
      false: {
        false: {
          Default: { track: resolve(swTokens.offLight, "rgba(11,32,63,0.35)"), thumb: resolve(swTokens.thumb, "#FFFFFF") },
          Hovered: { track: resolve(swTokens.offLightHover, "rgba(11,32,63,0.5)"), thumb: resolve(swTokens.thumb, "#FFFFFF") },
          Inactive: { track: resolve(swTokens.inactiveLight, "rgba(11,32,63,0.1)"), thumb: resolve(swTokens.thumbInactive, "rgba(255,255,255,0.6)") }
        },
        true: {
          Default: { track: resolve(swTokens.offNight, "rgba(255,255,255,0.3)"), thumb: resolve(swTokens.thumb, "#FFFFFF") },
          Hovered: { track: resolve(swTokens.offNightHover, "rgba(255,255,255,0.6)"), thumb: resolve(swTokens.thumb, "#FFFFFF") },
          Inactive: { track: resolve(swTokens.inactiveNight, "rgba(255,255,255,0.1)"), thumb: resolve(swTokens.thumbInactive, "rgba(255,255,255,0.6)") }
        }
      }
    }
  };

  const radios = {
    sizes: radiosCatalog.sizes || [{ id: "S", box: 20, inner: 14 }],
    states: radiosCatalog.states || ["Default", "Hovered"],
    defaultState: radiosCatalog.defaultState || "Default",
    defaultFilled: radiosCatalog.defaultFilled ?? true,
    palette: {
      true: {
        Default: { outer: resolve(rdTokens.on, "#56D67F"), inner: resolve(rdTokens.onInner, "#39AA5D") },
        Hovered: { outer: resolve(rdTokens.on, "#56D67F"), inner: resolve(rdTokens.onInner, "#39AA5D") }
      },
      false: {
        Default: { outer: resolve(rdTokens.off, "rgba(11,32,63,0.25)"), inner: resolve(rdTokens.core, "#FFFFFF") },
        Hovered: { outer: resolve(rdTokens.offHover, "rgba(11,32,63,0.35)"), inner: resolve(rdTokens.core, "#FFFFFF") }
      }
    }
  };

  return { checkboxes, switchers, radios };
}

function resolveColorReference(value, lookup, fallback) {
  const raw = String(value || "").trim();
  if (!raw) return fallback;
  if (raw.startsWith("#") || raw.startsWith("rgb(") || raw.startsWith("rgba(")) return raw;
  return lookup?.get(raw.toLowerCase()) || fallback;
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
