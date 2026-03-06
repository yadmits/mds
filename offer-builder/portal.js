(function portalPage() {
  const Store = window.OfferStore;
  if (!Store) return;

  const favoritesSection = document.getElementById("favorites-section");
  const favoritesList = document.getElementById("favorites-list");
  const allList = document.getElementById("all-list");
  const addOfferLink = document.querySelector(".portal-add-offer");

  addOfferLink?.addEventListener("click", (event) => {
    event.preventDefault();
    const draft = Store.createTemplate({
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
    window.location.href = `./editor.html?id=${encodeURIComponent(draft.id)}`;
  });

  render();

  function render() {
    const templates = Store.getTemplatesSorted();
    const favorites = templates.filter((template) => template.favorite);

    if (favorites.length === 0) {
      favoritesSection.classList.add("hidden");
    } else {
      favoritesSection.classList.remove("hidden");
      favoritesList.innerHTML = favorites.map((template) => templateRow(template)).join("");
    }

    allList.innerHTML = templates.map((template) => templateRow(template)).join("");
    bindList(favoritesList);
    bindList(allList);
  }

  function templateRow(template) {
    return `
    <article class="template-row" data-open="${template.id}">
      <div class="template-meta">
        <div class="template-title-line">
          ${template.favorite ? bookmarkIcon(true) : ""}
          <strong>${escapeHtml(Store.getTemplateHeading(template))}</strong>
        </div>
        <span>${escapeHtml(Store.getTemplateSummary(template))}</span>
      </div>
      <div class="template-actions">
        <button class="mini-icon" data-copy="${template.id}" type="button" aria-label="Дублировать">${copyIcon()}</button>
      </div>
    </article>`;
  }

  function bindList(container) {
    if (!container) return;

    container.querySelectorAll("[data-open]").forEach((row) => {
      row.addEventListener("click", () => {
        const id = row.getAttribute("data-open");
        window.location.href = `./editor.html?id=${encodeURIComponent(id)}`;
      });
    });

    container.querySelectorAll("[data-copy]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        const id = button.getAttribute("data-copy");
        const copy = Store.duplicateTemplate(id);
        if (!copy) return;
        window.location.href = `./editor.html?id=${encodeURIComponent(copy.id)}`;
      });
    });
  }

  function bookmarkIcon(active) {
    return `<svg class="bookmark ${active ? "active" : ""}" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.2c-.88 0-1.6.72-1.6 1.6v9.6c0 .15.09.29.22.35.14.06.3.04.41-.06L8 10.06l4.97 3.63c.12.1.28.12.41.06a.4.4 0 0 0 .22-.35V3.8c0-.88-.72-1.6-1.6-1.6H4Z"/></svg>`;
  }

  function copyIcon() {
    return `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.8 2.2A2.6 2.6 0 0 0 2.2 4.8v6.4a2.6 2.6 0 0 0 2.6 2.6h4a2.6 2.6 0 0 0 2.6-2.6V4.8a2.6 2.6 0 0 0-2.6-2.6h-4Zm0 1.2h4c.77 0 1.4.63 1.4 1.4v6.4c0 .77-.63 1.4-1.4 1.4h-4c-.77 0-1.4-.63-1.4-1.4V4.8c0-.77.63-1.4 1.4-1.4Z"/><path d="M8.8 4.2a.6.6 0 0 1 .6-.6h2a2.4 2.4 0 0 1 2.4 2.4v4.8a.6.6 0 0 1-1.2 0V6a1.2 1.2 0 0 0-1.2-1.2h-2a.6.6 0 0 1-.6-.6Z"/></svg>`;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
