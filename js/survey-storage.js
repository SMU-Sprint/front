(() => {
  "use strict";

  const DRAFT_KEY = "sprint.survey.draft.v1";

  function currentStep() {
    return Number(window.location.pathname.match(/survey(\d+)\.html$/)?.[1] || 1);
  }

  function readDraft() {
    try {
      return JSON.parse(sessionStorage.getItem(DRAFT_KEY)) || {};
    } catch {
      return {};
    }
  }

  function writeDraft(draft) {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }

  function collectForm(form) {
    const values = {};
    [...form.elements].forEach((field) => {
      const key = field.name || field.id;
      if (!key || field.disabled || ["button", "submit", "reset"].includes(field.type)) return;

      if (field.type === "checkbox") {
        if (!values[key]) values[key] = [];
        if (field.checked) values[key].push(field.value);
      } else if (field.type === "radio") {
        if (field.checked) values[key] = field.value;
      } else {
        values[key] = field.value;
      }
    });
    return values;
  }

  function save() {
    const form = document.getElementById("surveyForm");
    if (!form) return;
    const draft = readDraft();
    draft[`survey${currentStep()}`] = collectForm(form);
    writeDraft(draft);
  }

  function restore() {
    const form = document.getElementById("surveyForm");
    const values = readDraft()[`survey${currentStep()}`];
    if (!form || !values) return;

    [...form.elements].forEach((field) => {
      const key = field.name || field.id;
      if (!key || !(key in values)) return;

      if (field.type === "checkbox") {
        field.checked = Array.isArray(values[key]) && values[key].includes(field.value);
        field.dispatchEvent(new Event("change", { bubbles: true }));
      } else if (field.type === "radio") {
        field.checked = values[key] === field.value;
        field.dispatchEvent(new Event("change", { bubbles: true }));
      } else {
        field.value = values[key] ?? "";
        field.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });
  }

  function lockFutureSteps() {
    const step = currentStep();
    document.querySelectorAll(".step-nav a").forEach((link) => {
      const targetStep = Number(link.getAttribute("href")?.match(/survey(\d+)\.html/)?.[1]);
      if (!targetStep || targetStep <= step) return;
      link.setAttribute("aria-disabled", "true");
      link.setAttribute("tabindex", "-1");
      link.style.pointerEvents = "none";
      link.style.cursor = "default";
      link.style.opacity = "0.45";
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("surveyForm");
    restore();
    lockFutureSteps();
    form?.addEventListener("input", save);
    form?.addEventListener("change", save);
    document.querySelector(".step-nav")?.addEventListener("click", save);
    window.addEventListener("pagehide", save);
  });
})();
