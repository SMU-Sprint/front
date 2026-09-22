(function () {
  const DRAFT_KEY = "exerciseSurveyDraft";
  const RESULT_KEY = "exerciseSurveyResult";
  const SUBMITTED_KEY = "exerciseSurveySubmitted";

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

  function collectFormValues(form) {
    const values = {};
    const fields = [...form.elements].filter((field) => field.name || field.id);

    fields.forEach((field) => {
      if (field.disabled || ["button", "submit", "reset"].includes(field.type)) {
        return;
      }

      const key = field.name || field.id;

      if (field.type === "checkbox") {
        if (!values[key]) values[key] = [];
        if (field.checked) values[key].push(field.value);
        return;
      }

      if (field.type === "radio") {
        if (field.checked) values[key] = field.value;
        return;
      }

      values[key] = field.value;
    });

    return values;
  }

  function applyFormValues(form, values) {
    [...form.elements].forEach((field) => {
      const key = field.name || field.id;
      if (!key || !(key in values)) return;

      if (field.type === "checkbox") {
        field.checked = Array.isArray(values[key]) && values[key].includes(field.value);
        return;
      }

      if (field.type === "radio") {
        field.checked = values[key] === field.value;
        return;
      }

      field.value = values[key] ?? "";
      field.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }

  window.saveSurveyStep = function saveSurveyStep(stepName) {
    const form = document.getElementById("surveyForm");
    if (!form) return readDraft();

    const draft = readDraft();
    draft[stepName] = collectFormValues(form);
    writeDraft(draft);
    return draft;
  };

  window.restoreSurveyStep = function restoreSurveyStep(stepName) {
    const form = document.getElementById("surveyForm");
    const draft = readDraft();
    if (form && draft[stepName]) {
      applyFormValues(form, draft[stepName]);
    }
    return draft;
  };

  window.submitSurveyDraft = async function submitSurveyDraft(currentStepName) {
    const payload = window.saveSurveyStep(currentStepName);
    const endpoint = window.SURVEY_SUBMIT_URL || "/api/survey";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`survey submit failed: ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";
    const result = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    sessionStorage.setItem(RESULT_KEY, JSON.stringify(result));
    sessionStorage.setItem(SUBMITTED_KEY, JSON.stringify(payload));
    sessionStorage.removeItem(DRAFT_KEY);

    return result;
  };
})();
