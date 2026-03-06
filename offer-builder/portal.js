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
      salaryMonth: 0,
      salaryConditions: [],
      team: "Например, маркетинг",
      leadName: "Имя Фамилия",
      leadEmail: "surname@mindbox.cloud",
      fromText: "Имя Фамилия, должность",
      fromEmail: "surname@mindbox.cloud"
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
      <p class="template-updated">${escapeHtml(Store.formatUpdatedShort(template.updatedAt))}</p>
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
    return `<svg class="bookmark ${active ? "active" : ""}" viewBox="0 0 18 18" aria-hidden="true"><path d="M5 2.5A1.5 1.5 0 0 0 3.5 4v10.17a.34.34 0 0 0 .54.27L9 10.74l4.96 3.7a.34.34 0 0 0 .54-.27V4A1.5 1.5 0 0 0 13 2.5H5Z"/></svg>`;
  }

  function copyIcon() {
    return `<img class="copy-img" src="https://www.figma.com/api/mcp/asset/ad39edd0-5681-4974-acba-958b6c332367" alt="" />`;
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
