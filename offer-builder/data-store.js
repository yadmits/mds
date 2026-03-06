(function attachOfferStore(windowObj) {
  const config = windowObj.OFFER_BUILDER_CONFIG || {};
  const STORAGE_KEY = config.storageKey || "mindbox-offer-builder-v3";

  const DEFAULT_BENEFITS = [
    { title: "Современная\nтехника", text: "Ноутбук, монитор и периферию выдадим в офисе или доставим курьером." },
    { title: "Особенная\nкультура", text: "О праве вето, публичной обратной связи и культуре решений рассказывают действующие сотрудники.", cta: "Смотреть интервью", ctaUrl: "https://jobs.mindbox.ru/" },
    { title: "Льготы для IT", text: "Даем статус работника аккредитованной IT-компании." },
    { title: "Больничные\nи отпуска", text: "Сохраняем полную зарплату на больничном и не ограничиваем дни отпуска." },
    { title: "Софинансируем\n350 000 ₽/год", text: "Компенсируем траты на обучение, здоровье, спорт и психотерапию.", wide: true },
    { title: "Возможность\nбыть собой", text: "Играем в настолки, бегаем марафоны и путешествуем." },
    { title: "Прозрачность\nво всём", text: "Все решения компании открыты: от зарплат до запуска новых фич." },
    { title: "Растут все,\nкто этого хочет", text: "Можно расти в роли без перехода в менеджмент и увеличивать доход.", wide: true, growth: true }
  ];

  let memoryDb = null;

  function nowIso() {
    return new Date().toISOString();
  }

  function uid() {
    return `tpl_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function createDefaultTemplate(overrides) {
    const createdAt = nowIso();
    const updatedAt = createdAt;
    return {
      id: uid(),
      name: "Имя",
      position: "Должность",
      country: "ru",
      responseDate: "15 сентября 2025",
      salaryMonth: "100 000 ₽/мес.",
      salaryYear: "1 200 000 ₽/год",
      salaryConditions: [
        {
          id: uid(),
          title: "Премия за продажи",
          perk: "% от платежей всех клиентов",
          text: "Выплачивается первые 18 месяцев от продажи.\nПроцент зависит от MRR за последние 3 месяца:\n— 10% при сумме продаж 750 тысяч и более\n— 11% при сумме продаж 1 млн и более\n— 12% при сумме продаж 1,25 млн и более\n— 7% в иных случаях"
        }
      ],
      team: "Marketing",
      leadName: "Оля Арифанова",
      leadEmail: "arifanova@mindbox.cloud",
      workFormat: "Офис, Москва, ул. Правды, 26, этаж 12, гибкий график",
      fromText: "Имя Фамилия, должность",
      helpText: "Знает ответы на все вопросы",
      taxText: "С 2025 года в России изменилась шкала НДФЛ. Рассчитайте средний доход после налогов в калькуляторе.",
      taxButtonText: "Рассчитать заработную плату (net)",
      taxButtonUrl: "https://docs.google.com/spreadsheets/d/1H3RgbPO4BaEHnUrioMX6m-Dc_VaU1gERp95gAm0JcHk/edit?gid=686534902#gid=686534902",
      favorite: false,
      benefits: clone(DEFAULT_BENEFITS),
      createdAt,
      updatedAt,
      ...(overrides || {})
    };
  }

  function seedTemplates() {
    const a = createDefaultTemplate({ name: "Иван", position: "Веб-дизайнер", favorite: true, salaryMonth: "100 000 ₽/мес.", salaryYear: "" });
    const b = createDefaultTemplate({ name: "Имя", position: "Senior-Разработчик", country: "am", favorite: true, salaryMonth: "100 000 ₽/мес.", salaryYear: "" });
    const c = createDefaultTemplate({ name: "Анастасия", position: "Manager", salaryMonth: "000 000 ₽/мес.", salaryYear: "", salaryConditions: [] });
    const d = createDefaultTemplate({ name: "Игорь", position: "специалист по продажам", country: "am", salaryMonth: "356 352 ₽/мес.", salaryYear: "", salaryConditions: [] });
    const copied = createDefaultTemplate({ name: "(Копия) Анастасия", position: "Manager", salaryMonth: "000 000 ₽/мес.", salaryYear: "", salaryConditions: [] });
    return [copied, c, a, b, d].map((template, index) => {
      const shifted = new Date(Date.now() - index * 60_000).toISOString();
      return { ...template, createdAt: shifted, updatedAt: shifted };
    });
  }

  function normalizeCondition(condition) {
    return { id: condition.id || uid(), title: condition.title || "", perk: condition.perk || "", text: condition.text || "" };
  }

  function normalizeTemplate(template) {
    const base = createDefaultTemplate({});
    return {
      ...base,
      ...template,
      salaryConditions: Array.isArray(template.salaryConditions) ? template.salaryConditions.map(normalizeCondition) : [],
      benefits: Array.isArray(template.benefits) && template.benefits.length ? template.benefits : clone(DEFAULT_BENEFITS),
      favorite: Boolean(template.favorite),
      country: template.country === "am" ? "am" : "ru"
    };
  }

  function safeLocalStorageGet(key) {
    try {
      return windowObj.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function safeLocalStorageSet(key, value) {
    try {
      windowObj.localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }

  function readDb() {
    if (memoryDb) return clone(memoryDb);

    const raw = safeLocalStorageGet(STORAGE_KEY);
    if (!raw) {
      const templates = seedTemplates();
      const db = { templates };
      if (!safeLocalStorageSet(STORAGE_KEY, JSON.stringify(db))) memoryDb = clone(db);
      return db;
    }

    try {
      const parsed = JSON.parse(raw);
      return { templates: Array.isArray(parsed.templates) ? parsed.templates.map(normalizeTemplate) : seedTemplates() };
    } catch {
      const db = { templates: seedTemplates() };
      if (!safeLocalStorageSet(STORAGE_KEY, JSON.stringify(db))) memoryDb = clone(db);
      return db;
    }
  }

  function writeDb(db) {
    if (!safeLocalStorageSet(STORAGE_KEY, JSON.stringify(db))) {
      memoryDb = clone(db);
    }
  }

  function getTemplatesSorted() {
    const db = readDb();
    return [...db.templates].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  function getTemplateById(id) {
    const db = readDb();
    const found = db.templates.find((template) => template.id === id);
    return found ? normalizeTemplate(found) : null;
  }

  function saveTemplate(nextTemplate, options) {
    const touchUpdatedAt = !(options && options.touchUpdatedAt === false);
    const db = readDb();
    const normalized = normalizeTemplate(nextTemplate);
    const template = { ...normalized, updatedAt: touchUpdatedAt ? nowIso() : normalized.updatedAt || nowIso() };

    const index = db.templates.findIndex((item) => item.id === template.id);
    if (index === -1) db.templates.push(template);
    else db.templates[index] = template;

    writeDb(db);
    return template;
  }

  function createTemplate(overrides) {
    const template = createDefaultTemplate(overrides || {});
    return saveTemplate(template, { touchUpdatedAt: false });
  }

  function deleteTemplate(id) {
    const db = readDb();
    db.templates = db.templates.filter((template) => template.id !== id);
    writeDb(db);
  }

  function duplicateTemplate(id) {
    const source = getTemplateById(id);
    if (!source) return null;

    const duplicated = {
      ...source,
      id: uid(),
      name: `(Копия) ${source.name}`,
      favorite: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      salaryConditions: source.salaryConditions.map((item) => ({ ...item, id: uid() }))
    };

    return saveTemplate(duplicated, { touchUpdatedAt: false });
  }

  function toggleFavorite(id) {
    const template = getTemplateById(id);
    if (!template) return null;
    template.favorite = !template.favorite;
    return saveTemplate(template);
  }

  function addSalaryCondition(templateId) {
    const template = getTemplateById(templateId);
    if (!template) return null;

    template.salaryConditions.push({ id: uid(), title: `Условие ${template.salaryConditions.length + 1}`, perk: "", text: "" });
    return saveTemplate(template);
  }

  function removeSalaryCondition(templateId, conditionId) {
    const template = getTemplateById(templateId);
    if (!template) return null;
    template.salaryConditions = template.salaryConditions.filter((item) => item.id !== conditionId);
    return saveTemplate(template);
  }

  function getCountryLabel(country) {
    return country === "am" ? "Арм" : "Ру";
  }

  function getTemplateHeading(template) {
    const name = template.name || "Имя";
    const position = template.position || "Должность";
    return `${name}, ${position}`;
  }

  function getTemplateSummary(template) {
    const country = getCountryLabel(template.country);
    const salary = template.salaryMonth || "000 000 ₽/мес.";
    const count = template.salaryConditions.length;
    let suffix = "";

    if (count > 0) {
      const mod10 = count % 10;
      const mod100 = count % 100;
      let noun = "условий";
      if (mod10 === 1 && mod100 !== 11) noun = "условие";
      else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) noun = "условия";
      suffix = ` + ${count} ${noun} ЗП`;
    }

    return `${country}, ${salary}${suffix}`;
  }

  function formatSavedAt(isoDate) {
    const date = new Date(isoDate || Date.now());
    if (Number.isNaN(date.getTime())) return "—";
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${hh}:${min}, ${dd}.${mm}.${yyyy}`;
  }

  windowObj.OfferStore = {
    STORAGE_KEY,
    getTemplatesSorted,
    getTemplateById,
    saveTemplate,
    createTemplate,
    deleteTemplate,
    duplicateTemplate,
    toggleFavorite,
    addSalaryCondition,
    removeSalaryCondition,
    getCountryLabel,
    getTemplateHeading,
    getTemplateSummary,
    formatSavedAt
  };
})(window);
