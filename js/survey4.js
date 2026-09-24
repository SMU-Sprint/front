const nextBtn = document.getElementById("nextBtn");
const API_BASE_URL = "https://sprintkr.site/api/v1";
const SURVEY_STORAGE_KEYS = [
  "survey_purpose",
  "survey_exercisePurposeEtc",
  "survey_experienceFlag",
  "survey_constraintTypes",
  "survey_constraintEtc",
  "survey_occupationType",
  "survey_exerciseSpot",
  "survey_exerciseSpotEtc",
  "survey_preferredSport",
  "survey_vigorousDays",
  "survey_moderateDays",
  "survey_walkingDays",
  "survey_fatigueFlag",
  "survey_stairClimbFlag",
  "survey_walk300mFlag",
  "survey_weightLossFlag",
  "sprint.survey.draft.v1",
];

const ALLOWED_VALUES = {
  exercisePurpose: ["다이어트", "체형관리", "질병예방", "체력증진", "기타"],
  occupationType: ["활동", "비활동"],
  exerciseSpot: ["종목_특화_운동장", "산책로", "공터", "학교_체육시설", "기타"],
  constraintTypes: [
    "시간부족",
    "과도한업무",
    "경제적비용",
    "효과의불확실성",
    "운동방법의어려움",
    "흥미의부재",
    "부상이나통증",
    "환경문제",
    "기타",
  ],
};

function readJsonArray(key) {
  try {
    const value = JSON.parse(sessionStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : value ? [value] : [];
  } catch {
    const value = sessionStorage.getItem(key);
    return value ? [value] : [];
  }
}

function readBoolean(key) {
  return sessionStorage.getItem(key) === "true";
}

function readString(key) {
  const stored = sessionStorage.getItem(key);
  if (!stored) return "";
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed[0] || "" : String(parsed);
  } catch {
    return stored;
  }
}

function readNumber(key) {
  return Number.parseInt(sessionStorage.getItem(key) || "0", 10) || 0;
}

function buildSurveyPayload() {
  const exercisePurpose = readString("survey_purpose");
  const preferredSport = readString("survey_preferredSport");
  const constraintTypes = readJsonArray("survey_constraintTypes");
  const exerciseSpot = readString("survey_exerciseSpot");

  const payload = {
    exercisePurpose,
    exerciseExperienceFlag: readBoolean("survey_experienceFlag"),
    preferredSport,
    occupationType: readString("survey_occupationType"),
    vigorousDays: readNumber("survey_vigorousDays"),
    vigorousDurationMinutes: 0,
    moderateDays: readNumber("survey_moderateDays"),
    moderateDurationMinutes: 0,
    walkingDays: readNumber("survey_walkingDays"),
    walkingDurationMinutes: 0,
    exerciseSpot,
    fatigueFlag: readBoolean("survey_fatigueFlag"),
    stairClimbFlag: readBoolean("survey_stairClimbFlag"),
    walk300mFlag: readBoolean("survey_walk300mFlag"),
    weightLossFlag: readBoolean("survey_weightLossFlag"),
    constraintTypes,
  };

  if (exercisePurpose === "기타") {
    payload.exercisePurposeEtc = readString("survey_exercisePurposeEtc");
  }
  if (exerciseSpot === "기타") {
    payload.exerciseSpotEtc = readString("survey_exerciseSpotEtc");
  }
  if (constraintTypes.includes("기타")) {
    payload.constraintEtc = readString("survey_constraintEtc");
  }

  return payload;
}

function validateSurveyPayload(payload) {
  if (!ALLOWED_VALUES.exercisePurpose.includes(payload.exercisePurpose)) {
    throw new Error("운동 목적을 설문 1에서 다시 선택해 주세요.");
  }
  if (payload.exercisePurpose === "기타" && !payload.exercisePurposeEtc) {
    throw new Error("기타 운동 목적을 입력해 주세요.");
  }
  if (!ALLOWED_VALUES.occupationType.includes(payload.occupationType)) {
    throw new Error("직업 특성을 설문 2에서 다시 선택해 주세요.");
  }
  if (!ALLOWED_VALUES.exerciseSpot.includes(payload.exerciseSpot)) {
    throw new Error("운동 장소를 설문 2에서 다시 선택해 주세요.");
  }
  if (payload.exerciseSpot === "기타" && !payload.exerciseSpotEtc) {
    throw new Error("기타 운동 장소를 입력해 주세요.");
  }
  if (!payload.preferredSport || payload.preferredSport.length > 50) {
    throw new Error("선호 스포츠를 하나 선택해 주세요.");
  }
  if (
    !payload.constraintTypes.length ||
    payload.constraintTypes.some(
      (value) => !ALLOWED_VALUES.constraintTypes.includes(value),
    )
  ) {
    throw new Error("운동을 지속하기 어려운 점을 설문 1에서 다시 선택해 주세요.");
  }
  if (payload.constraintTypes.includes("기타") && !payload.constraintEtc) {
    throw new Error("기타 어려운 점을 입력해 주세요.");
  }
}

function apiErrorMessage(result, fallback) {
  if (typeof result?.message === "string" && result.message.trim()) {
    return result.message;
  }
  if (typeof result?.result === "string" && result.result.trim()) {
    return result.result;
  }
  return fallback;
}

async function submitSurvey() {
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    const error = new Error("로그인이 필요합니다.");
    error.status = 401;
    throw error;
  }

  const payload = buildSurveyPayload();
  validateSurveyPayload(payload);
  console.log("== [설문 제출 데이터] ==", payload);

  const response = await fetch(`${API_BASE_URL}/members/survey`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  let result = null;
  try {
    result = await response.json();
  } catch {
    result = {};
  }
  console.log("== [설문 제출 응답] ==", result);

  if (!response.ok || result.isSuccess === false) {
    const error = new Error(apiErrorMessage(result, "설문 제출에 실패했습니다."));
    error.status = response.status;
    throw error;
  }

  sessionStorage.setItem("survey_submitted", "true");
  sessionStorage.setItem("survey_lastPayload", JSON.stringify(payload));
  return result;
}

function clearSurveyDraft() {
  SURVEY_STORAGE_KEYS.forEach((key) => sessionStorage.removeItem(key));
}

// 1. 페이지 로드 시 저장된 데이터 복원
document.addEventListener("DOMContentLoaded", function () {
  const savedFatigue = sessionStorage.getItem("survey_fatigueFlag");
  if (savedFatigue !== null) {
    document.querySelectorAll('input[name="fatigue"]').forEach((input) => {
      if (input.value === savedFatigue) input.checked = true;
    });
  }

  const savedStairs = sessionStorage.getItem("survey_stairClimbFlag");
  if (savedStairs !== null) {
    document.querySelectorAll('input[name="stairs"]').forEach((input) => {
      if (input.value === savedStairs) input.checked = true;
    });
  }

  const savedWalking = sessionStorage.getItem("survey_walk300mFlag");
  if (savedWalking !== null) {
    document.querySelectorAll('input[name="walking"]').forEach((input) => {
      if (input.value === savedWalking) input.checked = true;
    });
  }

  const savedWeight = sessionStorage.getItem("survey_weightLossFlag");
  if (savedWeight !== null) {
    document.querySelectorAll('input[name="weight"]').forEach((input) => {
      if (input.value === savedWeight) input.checked = true;
    });
  }

  checkFormValidation();
});

// 2. 유효성 검사 및 버튼 제어
function checkFormValidation() {
  const fatigueChecked =
    document.querySelectorAll('input[name="fatigue"]:checked').length > 0;
  const stairsChecked =
    document.querySelectorAll('input[name="stairs"]:checked').length > 0;
  const walkingChecked =
    document.querySelectorAll('input[name="walking"]:checked').length > 0;
  const weightChecked =
    document.querySelectorAll('input[name="weight"]:checked').length > 0;

  if (fatigueChecked && stairsChecked && walkingChecked && weightChecked) {
    nextBtn.classList.remove("off");
    nextBtn.classList.add("on");
    nextBtn.removeAttribute("disabled");
  } else {
    nextBtn.classList.remove("on");
    nextBtn.classList.add("off");
    nextBtn.setAttribute("disabled", "true");
  }
}

// 3. 선택 시 실시간 저장 및 검증
document.querySelectorAll('input[type="radio"]').forEach((input) => {
  input.addEventListener("change", function () {
    const fatigueVal = document.querySelector('input[name="fatigue"]:checked');
    const stairsVal = document.querySelector('input[name="stairs"]:checked');
    const walkingVal = document.querySelector('input[name="walking"]:checked');
    const weightVal = document.querySelector('input[name="weight"]:checked');

    if (fatigueVal)
      sessionStorage.setItem("survey_fatigueFlag", fatigueVal.value === "true");
    if (stairsVal)
      sessionStorage.setItem(
        "survey_stairClimbFlag",
        stairsVal.value === "true",
      );
    if (walkingVal)
      sessionStorage.setItem(
        "survey_walk300mFlag",
        walkingVal.value === "true",
      );
    if (weightVal)
      sessionStorage.setItem(
        "survey_weightLossFlag",
        weightVal.value === "true",
      );

    checkFormValidation();
  });
});

// 4. '제출하기' 버튼 클릭 시 백엔드 제출 후 추천 페이지로 이동
nextBtn.addEventListener("click", async function () {
  if (nextBtn.hasAttribute("disabled")) return;
  if (!window.confirm("제출하시겠습니까?")) return;

  nextBtn.setAttribute("disabled", "true");
  nextBtn.textContent = "제출 중";

  try {
    await submitSurvey();
    clearSurveyDraft();
    window.location.href = "survey5.html";
  } catch (error) {
    console.error("설문 제출 에러:", error);
    if (error.status === 401) {
      localStorage.removeItem("accessToken");
      alert("로그인이 만료되었습니다. 다시 로그인해 주세요.");
      window.location.href = "login.html";
      return;
    }
    alert(error.message || "서버와 통신 중 오류가 발생했습니다.");
    nextBtn.removeAttribute("disabled");
    nextBtn.textContent = "제출하기";
  }
});
