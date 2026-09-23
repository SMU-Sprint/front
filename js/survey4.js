const nextBtn = document.getElementById("nextBtn");

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

// 4. '다음' 버튼 클릭 시 이동
nextBtn.addEventListener("click", function () {
  if (!nextBtn.hasAttribute("disabled")) {
    window.location.href = "survey5.html";
  }
});
