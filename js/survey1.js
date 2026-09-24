const nextBtn = document.getElementById("nextBtn");
const purposeEtcInput = document.getElementById("purposeEtcInput");
const constraintEtcInput = document.getElementById("constraintEtcInput");

function readStoredSingle(key) {
  const stored = sessionStorage.getItem(key);
  if (!stored) return "";
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed[0] || "" : String(parsed);
  } catch {
    return stored;
  }
}

function readStoredArray(key) {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
  } catch {
    return [];
  }
}

function updateConditionalFields() {
  const purpose = document.querySelector('input[name="purpose"]:checked')?.value;
  const limits = Array.from(
    document.querySelectorAll('input[name="limit"]:checked'),
  ).map((input) => input.value);
  purposeEtcInput.hidden = purpose !== "기타";
  constraintEtcInput.hidden = !limits.includes("기타");
}

function checkFormValidation() {
  const purpose = document.querySelector('input[name="purpose"]:checked')?.value;
  const experience = document.querySelector('input[name="experience"]:checked');
  const limits = Array.from(
    document.querySelectorAll('input[name="limit"]:checked'),
  ).map((input) => input.value);
  const valid =
    Boolean(purpose && experience && limits.length) &&
    (purpose !== "기타" || purposeEtcInput.value.trim() !== "") &&
    (!limits.includes("기타") || constraintEtcInput.value.trim() !== "");

  nextBtn.classList.toggle("on", valid);
  nextBtn.classList.toggle("off", !valid);
  nextBtn.disabled = !valid;
}

function saveDataAndValidate() {
  const purpose = document.querySelector('input[name="purpose"]:checked')?.value;
  const experience = document.querySelector('input[name="experience"]:checked')?.value;
  const limits = Array.from(
    document.querySelectorAll('input[name="limit"]:checked'),
  ).map((input) => input.value);

  if (purpose) sessionStorage.setItem("survey_purpose", purpose);
  if (experience) {
    sessionStorage.setItem("survey_experienceFlag", String(experience === "있다"));
  }
  sessionStorage.setItem("survey_constraintTypes", JSON.stringify(limits));
  sessionStorage.setItem(
    "survey_exercisePurposeEtc",
    purpose === "기타" ? purposeEtcInput.value.trim() : "",
  );
  sessionStorage.setItem(
    "survey_constraintEtc",
    limits.includes("기타") ? constraintEtcInput.value.trim() : "",
  );

  updateConditionalFields();
  checkFormValidation();
}

document.addEventListener("DOMContentLoaded", function () {
  const savedPurpose = readStoredSingle("survey_purpose");
  const purposeInput = document.querySelector(
    `input[name="purpose"][value="${CSS.escape(savedPurpose)}"]`,
  );
  if (purposeInput) purposeInput.checked = true;

  const savedExperience = sessionStorage.getItem("survey_experienceFlag");
  if (savedExperience !== null) {
    const value = savedExperience === "true" ? "있다" : "없다";
    const input = document.querySelector(`input[name="experience"][value="${value}"]`);
    if (input) input.checked = true;
  }

  const savedLimits = readStoredArray("survey_constraintTypes");
  document.querySelectorAll('input[name="limit"]').forEach((input) => {
    input.checked = savedLimits.includes(input.value);
  });
  purposeEtcInput.value = sessionStorage.getItem("survey_exercisePurposeEtc") || "";
  constraintEtcInput.value = sessionStorage.getItem("survey_constraintEtc") || "";

  updateConditionalFields();
  checkFormValidation();
});

document
  .querySelectorAll('input[type="checkbox"], input[type="radio"]')
  .forEach((input) => input.addEventListener("change", saveDataAndValidate));
purposeEtcInput.addEventListener("input", saveDataAndValidate);
constraintEtcInput.addEventListener("input", saveDataAndValidate);

nextBtn.addEventListener("click", function () {
  if (!nextBtn.disabled) window.location.href = "survey2.html";
});
