const nextBtn = document.getElementById("nextBtn");
const exerciseSpotEtcInput = document.getElementById("exerciseSpotEtcInput");

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

function updateSpotDetail() {
  const spot = document.querySelector('input[name="spot"]:checked')?.value;
  exerciseSpotEtcInput.hidden = spot !== "기타";
}

function checkFormValidation() {
  const job = document.querySelector('input[name="job"]:checked');
  const spot = document.querySelector('input[name="spot"]:checked')?.value;
  const sport = document.querySelector('input[name="sports"]:checked');
  const valid =
    Boolean(job && spot && sport) &&
    (spot !== "기타" || exerciseSpotEtcInput.value.trim() !== "");

  nextBtn.classList.toggle("on", valid);
  nextBtn.classList.toggle("off", !valid);
  nextBtn.disabled = !valid;
}

function saveDataAndValidate() {
  const job = document.querySelector('input[name="job"]:checked')?.value;
  const spot = document.querySelector('input[name="spot"]:checked')?.value;
  const sport = document.querySelector('input[name="sports"]:checked')?.value;

  if (job) sessionStorage.setItem("survey_occupationType", job);
  if (spot) sessionStorage.setItem("survey_exerciseSpot", spot);
  if (sport) sessionStorage.setItem("survey_preferredSport", sport);
  sessionStorage.setItem(
    "survey_exerciseSpotEtc",
    spot === "기타" ? exerciseSpotEtcInput.value.trim() : "",
  );

  updateSpotDetail();
  checkFormValidation();
}

document.addEventListener("DOMContentLoaded", function () {
  const savedValues = {
    job: sessionStorage.getItem("survey_occupationType") || "",
    spot: sessionStorage.getItem("survey_exerciseSpot") || "",
    sports: readStoredSingle("survey_preferredSport"),
  };

  Object.entries(savedValues).forEach(([name, value]) => {
    const input = document.querySelector(
      `input[name="${name}"][value="${CSS.escape(value)}"]`,
    );
    if (input) input.checked = true;
  });
  exerciseSpotEtcInput.value = sessionStorage.getItem("survey_exerciseSpotEtc") || "";

  updateSpotDetail();
  checkFormValidation();
});

document
  .querySelectorAll('input[type="radio"]')
  .forEach((input) => input.addEventListener("change", saveDataAndValidate));
exerciseSpotEtcInput.addEventListener("input", saveDataAndValidate);

nextBtn.addEventListener("click", function () {
  if (!nextBtn.disabled) window.location.href = "survey3.html";
});
