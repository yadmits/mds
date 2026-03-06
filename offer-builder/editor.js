(function editorPage() {
  const Store = window.OfferStore;
  if (!Store) return;

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
      salaryMonth: "000 000 ₽/мес.",
      salaryYear: "",
      salaryConditions: [],
      team: "Например, маркетинг",
      leadName: "Имя Фамилия",
      leadEmail: "surname@mindbox.cloud",
      fromText: "Имя Фамилия, должность"
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
      template[field] = target.value;
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
        ${formRow("ЗП в месяц", `<input data-field="salaryMonth" type="text" value="${escapeHtmlAttr(template.salaryMonth)}"/>`)}
        ${formRow("ЗП в год", `<input data-field="salaryYear" type="text" value="${escapeHtmlAttr(template.salaryYear)}"/>`)}
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
        ${formRow("Польза", `<input data-field="helpText" type="text" value="${escapeHtmlAttr(template.helpText)}"/>`)}
      </section>
    `;
  }

  function renderPreview() {
    const totalSalary = [template.salaryMonth, template.salaryYear].filter(Boolean).join("<br/>");

    refs.preview.innerHTML = `
      <section class="offer-top-section">
        <img class="offer-top-image" src="${ASSETS.heroBox}" alt="" />
        <h1>${escapeHtml(template.name)}, приглашаем в команду.<br/>Всё готово к твоему старту в Mindbox</h1>
        <div class="offer-date-pill">Дать ответ можно до ${escapeHtml(template.responseDate)}</div>
      </section>

      <section class="offer-details-section">
        ${previewRow("Заработная плата до вычета налогов (gross)", `<div class="value-strong">${totalSalary || "—"}</div>`) }
        ${template.salaryConditions
          .map((condition) =>
            previewRow(
              escapeHtml(condition.title || "Условие"),
              `<div class="value-strong">${escapeHtml(condition.perk || "")}</div><div class="value-muted">${escapeHtml(condition.text || "").replace(/\n/g, "<br/>")}</div>`
            )
          )
          .join("")}

        ${previewRow("Должность", escapeHtml(template.position))}
        ${previewRow("Команда", escapeHtml(template.team))}
        ${previewRow("Ведущий", `${escapeHtml(template.leadName)},<br/>${escapeHtml(template.leadEmail)}`)}
        ${previewRow("Формат и место работы", escapeHtml(template.workFormat))}

        ${
          template.country === "ru"
            ? `<div class="offer-tax">${previewRow(
                "Калькулятор прогрессивной шкалы НДФЛ",
                `<p>${escapeHtml(template.taxText)}</p><a href="${escapeHtmlAttr(template.taxButtonUrl)}" target="_blank" rel="noreferrer">${escapeHtml(template.taxButtonText)}</a>`
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
          <p>${escapeHtml(template.fromText)}</p>
          <p>${escapeHtml(template.helpText)}<br/>${escapeHtml(template.leadEmail)}</p>
        </div>
      </section>
    `;

    requestAnimationFrame(updatePreviewScale);
  }

  function previewRow(label, value) {
    return `<div class="preview-row"><div class="preview-label">${label}</div><div class="preview-value">${value}</div></div>`;
  }

  function formRow(label, control) {
    return `<label class="form-row"><span>${label}</span><div>${control}</div></label>`;
  }

  async function exportPdf() {
    const button = refs.export;
    const initialText = button.textContent;

    try {
      button.disabled = true;
      button.textContent = "Готовлю PDF...";

      const canvas = await window.html2canvas(refs.preview, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true
      });

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: canvas.width > canvas.height ? "landscape" : "portrait", unit: "px", format: [canvas.width, canvas.height] });
      const image = canvas.toDataURL("image/jpeg", 0.95);
      pdf.addImage(image, "JPEG", 0, 0, canvas.width, canvas.height, undefined, "FAST");
      pdf.save(`${safeFileName(Store.getTemplateHeading(template))}.pdf`);
    } catch (error) {
      console.error(error);
      alert("Не удалось сохранить PDF");
    } finally {
      button.disabled = false;
      button.textContent = initialText;
    }
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

  function bookmarkIcon(active) {
    return `<svg class="bookmark ${active ? "active" : ""}" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.2c-.88 0-1.6.72-1.6 1.6v9.6c0 .15.09.29.22.35.14.06.3.04.41-.06L8 10.06l4.97 3.63c.12.1.28.12.41.06a.4.4 0 0 0 .22-.35V3.8c0-.88-.72-1.6-1.6-1.6H4Z"/></svg>`;
  }

  function trashIcon() {
    return `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.8 2a.6.6 0 0 0-.56.4L6 3H3.5a.6.6 0 1 0 0 1.2h.27l.66 8.2A1.8 1.8 0 0 0 6.23 14h3.54a1.8 1.8 0 0 0 1.8-1.6l.66-8.2h.27a.6.6 0 1 0 0-1.2H10l-.24-.6A.6.6 0 0 0 9.2 2H6.8Zm.17 1.2h2.06l.1.26-.03.04H6.9l-.03-.04.1-.26ZM5 4.2h6l-.63 8.11a.6.6 0 0 1-.6.49H6.23a.6.6 0 0 1-.6-.49L5 4.2Zm1.8 1.4a.6.6 0 0 0-.6.6v4a.6.6 0 1 0 1.2 0v-4a.6.6 0 0 0-.6-.6Zm2.4 0a.6.6 0 0 0-.6.6v4a.6.6 0 1 0 1.2 0v-4a.6.6 0 0 0-.6-.6Z"/></svg>`;
  }

  function safeFileName(value) {
    return value.toLowerCase().replace(/[^a-zA-Zа-яА-Я0-9]+/g, "-").replace(/^-+|-+$/g, "") || "offer";
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
