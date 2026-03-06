(function editorPage() {
  const Store = window.OfferStore;
  if (!Store) return;

  const PT_PER_PX = 0.75;

  const ASSETS = {
    heroBox: "https://www.figma.com/api/mcp/asset/05d9363e-f9e7-47b1-becf-06fb39a0968e",
    benefitCat: "https://www.figma.com/api/mcp/asset/ecf978e7-b22d-416b-93bf-3895918118e9",
    benefitGreen: "https://www.figma.com/api/mcp/asset/65298bb2-f7d3-4bc0-b698-29b7719d2b02",
    benefitGlasses: "https://www.figma.com/api/mcp/asset/832e2eca-8e26-4794-bb1c-e7c32d0b1fab",
    growthLandscape: "https://www.figma.com/api/mcp/asset/ef0f23b0-039d-4d8d-91eb-002cb8a5a2a1",
    benefitsGradientBg: "https://www.figma.com/api/mcp/asset/806d2360-5fae-46af-a369-a024180a58d3"
  };

  const params = new URLSearchParams(window.location.search);
  const templateId = params.get("id");
  const createNew = params.get("new") === "1";
  let template = templateId ? Store.getTemplateById(templateId) : null;

  if (!template && createNew) {
    template = Store.createTemplate({
      name: "Имя",
      position: "Должность",
      responseDate: "ДД месяц ГГГГ",
      salaryMonth: 0,
      salaryConditions: [],
      team: "Например, маркетинг",
      leadName: "Имя Фамилия",
      leadEmail: "surname@mindbox.cloud",
      fromText: "Имя Фамилия, должность",
      fromEmail: "surname@mindbox.cloud"
    });

    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.delete("new");
    nextUrl.searchParams.set("id", template.id);
    window.history.replaceState({}, "", `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
  }

  if (!template) template = Store.getTemplatesSorted()[0] || null;
  if (!template) {
    window.location.href = "./index.html";
    return;
  }

  const refs = {
    form: document.getElementById("editor-form"),
    preview: document.getElementById("offer-preview"),
    title: document.getElementById("sidebar-title"),
    subtitle: document.getElementById("sidebar-subtitle"),
    favorite: document.getElementById("favorite-btn"),
    duplicate: document.getElementById("duplicate-btn"),
    export: document.getElementById("export-btn"),
    savedAt: document.getElementById("saved-at"),
    delete: document.getElementById("delete-btn"),
    modal: document.getElementById("delete-modal"),
    cancelDelete: document.getElementById("cancel-delete"),
    confirmDelete: document.getElementById("confirm-delete"),
    previewWrap: document.getElementById("preview-scale-wrap")
  };

  let saveTimer = null;
  let curveFontPromise = null;

  renderAll();
  bindEvents();
  updatePreviewScale();
  window.addEventListener("resize", updatePreviewScale);

  function bindEvents() {
    refs.form.addEventListener("input", onFormInput);
    refs.form.addEventListener("change", onFormInput);
    refs.form.addEventListener("click", onFormClick);

    refs.favorite.addEventListener("click", () => {
      const updated = Store.toggleFavorite(template.id);
      if (!updated) return;
      template = updated;
      renderHeader();
    });

    refs.duplicate.addEventListener("click", () => {
      const copy = Store.duplicateTemplate(template.id);
      if (!copy) return;
      window.location.href = `./editor.html?id=${encodeURIComponent(copy.id)}`;
    });

    refs.delete.addEventListener("click", () => refs.modal.classList.remove("hidden"));
    refs.cancelDelete.addEventListener("click", () => refs.modal.classList.add("hidden"));

    refs.modal.addEventListener("click", (event) => {
      if (event.target === refs.modal) refs.modal.classList.add("hidden");
    });

    refs.confirmDelete.addEventListener("click", () => {
      Store.deleteTemplate(template.id);
      refs.modal.classList.add("hidden");
      window.location.href = "./index.html";
    });

    refs.export.addEventListener("click", exportPdf);
  }

  function onFormInput(event) {
    const target = event.target;

    if (target.matches("[data-field]")) {
      const field = target.getAttribute("data-field");
      if (field === "salaryMonth") {
        const digits = target.value.replace(/\D+/g, "");
        template.salaryMonth = digits ? Number.parseInt(digits, 10) : 0;
        target.value = formatInputNumber(template.salaryMonth);
      } else {
        template[field] = target.value;
      }
    }

    if (target.matches("[data-country]")) {
      template.country = target.value;
    }

    if (target.matches("[data-cond-id][data-cond-field]")) {
      const condId = target.getAttribute("data-cond-id");
      const condField = target.getAttribute("data-cond-field");
      const condition = template.salaryConditions.find((item) => item.id === condId);
      if (condition) condition[condField] = target.value;
    }

    renderHeader();
    renderPreview();
    queueSave();
  }

  function onFormClick(event) {
    const addButton = event.target.closest("[data-add-condition]");
    if (addButton) {
      event.preventDefault();
      const updated = Store.addSalaryCondition(template.id);
      if (!updated) return;
      template = updated;
      renderAll();
      queueSave();
      return;
    }

    const removeButton = event.target.closest("[data-remove-condition]");
    if (removeButton) {
      event.preventDefault();
      const condId = removeButton.getAttribute("data-remove-condition");
      const updated = Store.removeSalaryCondition(template.id, condId);
      if (!updated) return;
      template = updated;
      renderAll();
      queueSave();
    }
  }

  function queueSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      template = Store.saveTemplate(template);
      renderSavedAt();
    }, 220);
  }

  function renderAll() {
    renderHeader();
    renderForm();
    renderPreview();
    renderSavedAt();
  }

  function renderHeader() {
    refs.title.textContent = Store.getTemplateHeading(template);
    refs.subtitle.textContent = Store.getTemplateSummary(template);
    refs.favorite.innerHTML = bookmarkIcon(template.favorite);
    refs.favorite.classList.toggle("active", Boolean(template.favorite));
  }

  function renderSavedAt() {
    refs.savedAt.textContent = `Сохранен ${Store.formatSavedAt(template.updatedAt)}`;
  }

  function renderForm() {
    refs.form.innerHTML = `
      <section class="form-group">
        ${formRow(
          "Страна",
          `<div class="country-radios">
            <label><input type="radio" name="country" value="ru" data-country ${template.country === "ru" ? "checked" : ""}/> Россия</label>
            <label><input type="radio" name="country" value="am" data-country ${template.country === "am" ? "checked" : ""}/> Армения</label>
          </div>`
        )}
        ${formRow("Имя", `<input data-field="name" type="text" value="${escapeHtmlAttr(template.name)}"/>`)}
        ${formRow("Ответ до", `<input data-field="responseDate" type="text" value="${escapeHtmlAttr(template.responseDate)}"/>`)}
      </section>

      <section class="form-group">
        ${formRow("ЗП, ₽/мес.", `<input data-field="salaryMonth" inputmode="numeric" type="text" value="${escapeHtmlAttr(formatInputNumber(template.salaryMonth))}"/>`)}
        ${template.salaryConditions
          .map(
            (condition, index) => `
            <div class="condition-block">
              <div class="condition-head">
                <strong>Условие ${index + 1}</strong>
                <button class="mini-icon" data-remove-condition="${condition.id}" type="button" aria-label="Удалить условие">${trashIcon()}</button>
              </div>
              ${formRow("Заголовок", `<input data-cond-id="${condition.id}" data-cond-field="title" type="text" value="${escapeHtmlAttr(condition.title)}"/>`)}
              ${formRow("Плюшка", `<input data-cond-id="${condition.id}" data-cond-field="perk" type="text" value="${escapeHtmlAttr(condition.perk)}"/>`)}
              ${formRow("Текст", `<textarea data-cond-id="${condition.id}" data-cond-field="text" rows="5">${escapeHtml(condition.text)}</textarea>`)}
            </div>`
          )
          .join("")}
        <button class="btn btn-soft" data-add-condition type="button">+ Добавить условие ЗП</button>
      </section>

      <section class="form-group">
        ${formRow("Должность", `<input data-field="position" type="text" value="${escapeHtmlAttr(template.position)}"/>`)}
        ${formRow("Команда", `<input data-field="team" type="text" value="${escapeHtmlAttr(template.team)}"/>`)}
        ${formRow("Ведущий", `<input data-field="leadName" type="text" value="${escapeHtmlAttr(template.leadName)}"/>`)}
        ${formRow("Его почта", `<input data-field="leadEmail" type="email" value="${escapeHtmlAttr(template.leadEmail)}"/>`)}
        ${formRow("Формат", `<textarea data-field="workFormat" rows="5">${escapeHtml(template.workFormat)}</textarea>`)}
        ${formRow("От кого", `<input data-field="fromText" type="text" value="${escapeHtmlAttr(template.fromText)}"/>`)}
        ${formRow("Почта", `<input data-field="fromEmail" type="email" value="${escapeHtmlAttr(template.fromEmail || "")}"/>`)}
      </section>
    `;
  }

  function renderPreview() {
    const salaryMonth = Number(template.salaryMonth) || 0;
    const salaryYear = salaryMonth * 12;

    const salaryConditionsHtml = template.salaryConditions
      .map((condition) =>
        previewRow(
          escapeHtml(condition.title || "Условие"),
          `<div class="value-strong">${applyNbsp(escapeHtml(condition.perk || ""))}</div><div class="value-muted">${applyNbsp(escapeHtml(condition.text || "")).replace(/\n/g, "<br/>")}</div>`,
          false
        )
      )
      .join("");

    refs.preview.innerHTML = `
      <section class="offer-top-section">
        <img class="offer-top-image" src="${ASSETS.heroBox}" alt="" />
        <h1>${escapeHtml(template.name)}, приглашаем в команду.<br/>Всё готово к твоему старту в Mindbox</h1>
        <div class="offer-date-pill">Дать ответ можно до ${escapeHtml(template.responseDate)}</div>
      </section>

      <section class="offer-details-section">
        ${previewRow(
          "Заработная плата до вычета налогов (gross)",
          `<div class="value-strong">${salaryMonth ? formatSalary(salaryMonth, "мес") : "—"}<br/>${salaryYear ? formatSalary(salaryYear, "год") : "—"}</div>`,
          false
        )}
        ${salaryConditionsHtml}
        ${template.salaryConditions.length > 0 ? `<div class="preview-divider"></div>` : ""}
        ${previewRow("Должность", applyNbsp(escapeHtml(template.position)), false)}
        ${previewRow("Команда", applyNbsp(escapeHtml(template.team)), false)}
        ${previewRow("Ведущий", `${applyNbsp(escapeHtml(template.leadName))},<br/>${applyNbsp(escapeHtml(template.leadEmail))}`, false)}
        ${previewRow("Формат и место работы", applyNbsp(escapeHtml(template.workFormat)), false)}

        ${
          template.country === "ru"
            ? `<div class="offer-tax">${previewRow(
                "Калькулятор прогрессивной шкалы НДФЛ",
                `<p>${applyNbsp(escapeHtml(template.taxText))}</p><a href="${escapeHtmlAttr(template.taxButtonUrl)}" target="_blank" rel="noreferrer">${escapeHtml(template.taxButtonText)}</a>`,
                false
              )}</div>`
            : ""
        }
      </section>

      <section class="offer-benefits-section">
        <div class="benefits-gradient" style="background-image:url('${ASSETS.benefitsGradientBg}')"></div>
        <h2>Все плюсы в одном месте</h2>
        <div class="benefits-grid">
          <article class="benefit-card"><h3>Современная<br/>техника</h3><p>Ноутбук, монитор и периферию выдадим в офисе.</p></article>
          <article class="benefit-card with-button"><h3>Особенная<br/>культура</h3><p>О праве вето, публичной обратной связи и культуре решений рассказывают сотрудники.</p><a href="https://jobs.mindbox.ru/" target="_blank" rel="noreferrer">Смотреть интервью</a></article>
          <article class="benefit-card has-image"><h3>Льготы для IT</h3><p>Даем статус работника аккредитованной IT-компании.</p><img src="${ASSETS.benefitCat}" alt="" /></article>
          <article class="benefit-card"><h3>Больничные<br/>и отпуска</h3><p>Сохраняем полную зарплату во время болезни и не ограничиваем отпуск.</p></article>
          <article class="benefit-card wide has-image green"><h3>Софинансируем<br/>350 000 ₽/год</h3><p>Частично возмещаем траты на обучение, здоровье, спорт и психотерапию.</p><img src="${ASSETS.benefitGreen}" alt="" /></article>
          <article class="benefit-card has-image"><h3>Возможность<br/>быть собой</h3><p>Играем в настолки, бегаем марафоны и путешествуем.</p><img src="${ASSETS.benefitGlasses}" alt="" /></article>
          <article class="benefit-card"><h3>Прозрачность<br/>во всём</h3><p>Все решения компании открыты: от зарплат до запуска новых фич.</p></article>
          <article class="benefit-card wide growth-card"><h3>Растут все,<br/>кто этого хочет</h3><p>Можно расти в роли без перехода в менеджмент и увеличивать доход.</p><img src="${ASSETS.growthLandscape}" alt="" /></article>
        </div>

        <div class="offer-join">
          <h3>Присоединяйся,<br/>не хватает только <span>тебя!</span></h3>
          <p>${applyNbsp(escapeHtml(template.fromText))}</p>
          <p>${applyNbsp(escapeHtml(template.helpText))}<br/>${applyNbsp(escapeHtml(template.fromEmail || template.leadEmail || ""))}</p>
        </div>
      </section>
    `;

    requestAnimationFrame(updatePreviewScale);
  }

  function previewRow(label, value, withDivider) {
    return `<div class="preview-row ${withDivider ? "with-divider" : ""}"><div class="preview-label">${label}</div><div class="preview-value">${value}</div></div>`;
  }

  function formRow(label, control) {
    return `<label class="form-row"><span>${label}</span><div>${control}</div></label>`;
  }

  function formatInputNumber(value) {
    const num = Number(value) || 0;
    return num ? Store.formatNumberRu(num) : "";
  }

  function formatSalary(value, period) {
    return `${Store.formatNumberRu(value)}\u00A0₽/${period}.`;
  }

  async function exportPdf() {
    const button = refs.export;
    const initialText = button.textContent;

    try {
      if (!window.html2canvas || !window.jspdf || !window.opentype) throw new Error("Export libraries unavailable");

      button.disabled = true;
      button.textContent = "Готовлю PDF...";

      const rootRect = refs.preview.getBoundingClientRect();
      const widthPx = refs.preview.offsetWidth;
      const heightPx = refs.preview.scrollHeight;
      const widthPt = widthPx * PT_PER_PX;
      const heightPt = heightPx * PT_PER_PX;

      const textBlocks = collectRenderableTextBlocks(refs.preview);
      let backgroundCanvas = null;

      try {
        backgroundCanvas = await capturePreviewWithoutText(textBlocks, false);
      } catch {
        backgroundCanvas = await capturePreviewWithoutText(textBlocks, true);
      }

      const backgroundData = backgroundCanvas.toDataURL("image/jpeg", 0.82);

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: widthPt > heightPt ? "landscape" : "portrait",
        unit: "pt",
        format: [widthPt, heightPt],
        compress: true
      });

      pdf.addImage(backgroundData, "JPEG", 0, 0, widthPt, heightPt, undefined, "MEDIUM");

      const font = await loadCurveFont();
      for (const block of textBlocks) {
        try {
          if (font) drawTextBlockAsCurves(pdf, font, block, rootRect);
          else drawTextBlockFallback(pdf, block, rootRect);
        } catch {
          drawTextBlockFallback(pdf, block, rootRect);
        }
      }

      pdf.save(buildPdfFileName());
    } catch (error) {
      console.error(error);
      alert("Не удалось сохранить PDF");
    } finally {
      button.disabled = false;
      button.textContent = initialText;
    }
  }

  function loadCurveFont() {
    if (curveFontPromise) return curveFontPromise;

    curveFontPromise = new Promise((resolve) => {
      const urls = [
        new URL("../knowledge-base/assets/fonts/CoFoSansVariable.woff", window.location.href).href,
        new URL("../knowledge-base/assets/fonts/CoFoSansVariable.woff2", window.location.href).href
      ];

      const tryLoad = (index) => {
        if (index >= urls.length) {
          resolve(null);
          return;
        }

        window.opentype.load(urls[index], (error, font) => {
          if (!error && font) resolve(font);
          else tryLoad(index + 1);
        });
      };

      tryLoad(0);
    });

    return curveFontPromise;
  }

  async function capturePreviewWithoutText(textBlocks, stripImages) {
    textBlocks.forEach((block, index) => block.element.setAttribute("data-pdf-text-id", String(index)));

    const host = document.createElement("div");
    host.style.position = "fixed";
    host.style.left = "-100000px";
    host.style.top = "0";
    host.style.width = `${refs.preview.offsetWidth}px`;
    host.style.pointerEvents = "none";

    const clone = refs.preview.cloneNode(true);
    clone.style.transform = "none";
    clone.style.width = `${refs.preview.offsetWidth}px`;

    clone.querySelectorAll("[data-pdf-text-id]").forEach((node) => {
      node.style.color = "transparent";
      node.style.webkitTextFillColor = "transparent";
      node.style.textShadow = "none";
    });

    if (stripImages) {
      clone.querySelectorAll("img").forEach((img) => img.remove());
      clone.querySelectorAll("*").forEach((node) => {
        const style = node.style;
        if (style.backgroundImage) style.backgroundImage = "none";
      });
    }

    host.appendChild(clone);
    document.body.appendChild(host);

    try {
      return await window.html2canvas(clone, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false
      });
    } finally {
      host.remove();
      textBlocks.forEach((block) => block.element.removeAttribute("data-pdf-text-id"));
    }
  }

  function collectRenderableTextBlocks(root) {
    const selectors = "h1,h2,h3,p,a,span,strong,li";

    return Array.from(root.querySelectorAll(selectors))
      .filter((element) => {
        const childElements = Array.from(element.children).filter((child) => child.tagName !== "BR");
        if (childElements.length > 0) return false;
        if (!element.textContent || !element.textContent.trim()) return false;

        const style = window.getComputedStyle(element);
        if (style.display === "none" || style.visibility === "hidden" || Number.parseFloat(style.opacity) === 0) return false;

        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      })
      .map((element) => ({ element, rect: element.getBoundingClientRect(), style: window.getComputedStyle(element) }));
  }

  function drawTextBlockAsCurves(pdf, font, block, rootRect) {
    const text = (block.element.innerText || block.element.textContent || "").replace(/\r/g, "");
    if (!text.trim()) return;

    const lines = text.split("\n");
    const fontSizePx = Number.parseFloat(block.style.fontSize) || 16;
    const lineHeightPx = Number.isFinite(Number.parseFloat(block.style.lineHeight)) ? Number.parseFloat(block.style.lineHeight) : fontSizePx * 1.2;
    const letterSpacingPx = Number.isFinite(Number.parseFloat(block.style.letterSpacing)) ? Number.parseFloat(block.style.letterSpacing) : 0;
    const align = block.style.textAlign;
    const color = parseCssColor(block.style.color);

    const x0 = block.rect.left - rootRect.left;
    const y0 = block.rect.top - rootRect.top;
    const ascenderPx = (font.ascender / font.unitsPerEm) * fontSizePx;
    const firstBaseline = y0 + (lineHeightPx - fontSizePx) / 2 + ascenderPx;

    pdf.setFillColor(color.r, color.g, color.b);

    lines.forEach((line, lineIndex) => {
      const normalized = line.replace(/\u00a0/g, " ");
      const lineWidth = measureLineWidth(font, normalized, fontSizePx, letterSpacingPx);
      let lineX = x0;
      if (align === "center") lineX = x0 + (block.rect.width - lineWidth) / 2;
      if (align === "right" || align === "end") lineX = x0 + block.rect.width - lineWidth;

      const baseline = firstBaseline + lineIndex * lineHeightPx;
      drawLineAsPath(pdf, font, normalized, lineX, baseline, fontSizePx, letterSpacingPx);
    });
  }

  function drawTextBlockFallback(pdf, block, rootRect) {
    const text = (block.element.innerText || block.element.textContent || "").replace(/\r/g, "");
    if (!text.trim()) return;

    const lines = text.split("\n");
    const fontSizePx = Number.parseFloat(block.style.fontSize) || 16;
    const lineHeightPx = Number.isFinite(Number.parseFloat(block.style.lineHeight)) ? Number.parseFloat(block.style.lineHeight) : fontSizePx * 1.2;
    const color = parseCssColor(block.style.color);
    const align = block.style.textAlign;
    const x0 = block.rect.left - rootRect.left;
    const y0 = block.rect.top - rootRect.top;

    pdf.setTextColor(color.r, color.g, color.b);
    pdf.setFont("helvetica", Number.parseFloat(block.style.fontWeight) >= 500 ? "bold" : "normal");
    pdf.setFontSize(toPt(fontSizePx));

    lines.forEach((line, index) => {
      let x = toPt(x0);
      const y = toPt(y0 + (index + 1) * lineHeightPx - (lineHeightPx - fontSizePx) / 2);
      const w = pdf.getTextWidth(line);
      if (align === "center") x = toPt(x0 + block.rect.width / 2) - w / 2;
      if (align === "right" || align === "end") x = toPt(x0 + block.rect.width) - w;
      pdf.text(line, x, y);
    });
  }

  function measureLineWidth(font, line, fontSizePx, letterSpacingPx) {
    let width = 0;
    for (const symbol of line) width += font.getAdvanceWidth(symbol, fontSizePx) + letterSpacingPx;
    return width;
  }

  function drawLineAsPath(pdf, font, line, xPx, yPx, fontSizePx, letterSpacingPx) {
    let cursor = xPx;

    for (const symbol of line) {
      const path = font.getPath(symbol, cursor, yPx, fontSizePx);
      const ops = toPdfPathOps(path);
      if (ops.length > 0) pdf.path(ops, "F");
      cursor += font.getAdvanceWidth(symbol, fontSizePx) + letterSpacingPx;
    }
  }

  function toPdfPathOps(path) {
    const ops = [];
    let currentX = 0;
    let currentY = 0;

    for (const command of path.commands) {
      if (command.type === "M") {
        currentX = command.x;
        currentY = command.y;
        ops.push({ op: "m", c: [toPt(command.x), toPt(command.y)] });
      } else if (command.type === "L") {
        currentX = command.x;
        currentY = command.y;
        ops.push({ op: "l", c: [toPt(command.x), toPt(command.y)] });
      } else if (command.type === "C") {
        currentX = command.x;
        currentY = command.y;
        ops.push({ op: "c", c: [toPt(command.x1), toPt(command.y1), toPt(command.x2), toPt(command.y2), toPt(command.x), toPt(command.y)] });
      } else if (command.type === "Q") {
        const c1x = currentX + (2 / 3) * (command.x1 - currentX);
        const c1y = currentY + (2 / 3) * (command.y1 - currentY);
        const c2x = command.x + (2 / 3) * (command.x1 - command.x);
        const c2y = command.y + (2 / 3) * (command.y1 - command.y);
        currentX = command.x;
        currentY = command.y;
        ops.push({ op: "c", c: [toPt(c1x), toPt(c1y), toPt(c2x), toPt(c2y), toPt(command.x), toPt(command.y)] });
      } else if (command.type === "Z") {
        ops.push({ op: "h", c: [] });
      }
    }

    return ops;
  }

  function toPt(valuePx) {
    return valuePx * PT_PER_PX;
  }

  function parseCssColor(value) {
    const match = String(value || "").match(/rgba?\(([^)]+)\)/i);
    if (!match) return { r: 41, g: 43, b: 50 };

    const [r, g, b] = match[1].split(",").map((item) => Number.parseFloat(item.trim()) || 0);
    return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
  }

  function updatePreviewScale() {
    if (!refs.previewWrap || !refs.preview) return;
    const baseWidth = 1100;
    const isDesktop = window.innerWidth > 1000;
    const available = isDesktop ? Math.max(420, window.innerWidth - 480 - 80) : Math.min(286, Math.max(220, window.innerWidth - 24));
    const scale = Math.min(1, available / baseWidth);

    refs.preview.style.transformOrigin = "top left";
    refs.preview.style.transform = `scale(${scale})`;
    refs.previewWrap.style.width = `${baseWidth * scale}px`;
    refs.previewWrap.style.height = `${refs.preview.scrollHeight * scale}px`;
  }

  function applyNbsp(value) {
    return String(value || "")
      .replace(/(\d) (\d{3})(?=(\D|$))/g, "$1\u00A0$2")
      .replace(/(^|\s)([А-Яа-яA-Za-z]{1,2})\s/g, "$1$2\u00A0")
      .replace(/\s₽/g, "\u00A0₽");
  }

  function bookmarkIcon(active) {
    return `<svg class="bookmark ${active ? "active" : ""}" viewBox="0 0 18 18" aria-hidden="true"><path d="M5 2.5A1.5 1.5 0 0 0 3.5 4v10.17a.34.34 0 0 0 .54.27L9 10.74l4.96 3.7a.34.34 0 0 0 .54-.27V4A1.5 1.5 0 0 0 13 2.5H5Z"/></svg>`;
  }

  function trashIcon() {
    return `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.8 2a.6.6 0 0 0-.56.4L6 3H3.5a.6.6 0 1 0 0 1.2h.27l.66 8.2A1.8 1.8 0 0 0 6.23 14h3.54a1.8 1.8 0 0 0 1.8-1.6l.66-8.2h.27a.6.6 0 1 0 0-1.2H10l-.24-.6A.6.6 0 0 0 9.2 2H6.8Zm.17 1.2h2.06l.1.26-.03.04H6.9l-.03-.04.1-.26ZM5 4.2h6l-.63 8.11a.6.6 0 0 1-.6.49H6.23a.6.6 0 0 1-.6-.49L5 4.2Zm1.8 1.4a.6.6 0 0 0-.6.6v4a.6.6 0 1 0 1.2 0v-4a.6.6 0 0 0-.6-.6Zm2.4 0a.6.6 0 0 0-.6.6v4a.6.6 0 1 0 1.2 0v-4a.6.6 0 0 0-.6-.6Z"/></svg>`;
  }

  function buildPdfFileName() {
    const position = String(template.position || "Должность").trim();
    const responseDate = String(template.responseDate || "дата").trim();
    const raw = `Оффер от Mindbox – ${position}, до ${responseDate}`;
    return `${sanitizeFileName(raw)}.pdf`;
  }

  function sanitizeFileName(value) {
    return String(value || "Оффер от Mindbox")
      .replace(/[\\/:*?"<>|]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeHtmlAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
  }
})();
