const nextBtn = document.getElementById("nextBtn");

// 1. 페이지가 로드될 때 sessionStorage에 저장된 값이 있다면 체크박스/라디오를 다시 복원
document.addEventListener("DOMContentLoaded", function () {
  // 1-1. 운동 목적 복원
  const savedPurpose = sessionStorage.getItem("survey_purpose");
  if (savedPurpose) {
    try {
      const purposes = JSON.parse(savedPurpose);
      document.querySelectorAll('input[name="purpose"]').forEach((input) => {
        if (purposes.includes(input.value)) {
          input.checked = true;
        }
      });
    } catch (e) {}
  }

  // 1-2. 운동 경험 복원
  const savedExperience = sessionStorage.getItem("survey_experienceFlag");
  if (savedExperience !== null) {
    const isExperienced = savedExperience === "true";
    document.querySelectorAll('input[name="experience"]').forEach((input) => {
      if (
        (input.value === "있다" && isExperienced) ||
        (input.value === "없다" && !isExperienced)
      ) {
        input.checked = true;
      }
    });
  }

  // 1-3. 제약사항 복원
  const savedLimits = sessionStorage.getItem("survey_constraintTypes");
  if (savedLimits) {
    try {
      const limits = JSON.parse(savedLimits);
      document.querySelectorAll('input[name="limit"]').forEach((input) => {
        if (limits.includes(input.value)) {
          input.checked = true;
        }
      });
    } catch (e) {}
  }

  // 복원 완료 후 버튼 활성화 여부 체크
  checkFormValidation();
});

// 2. 폼 유효성 검사 및 버튼 상태 제어
function checkFormValidation() {
  const purposeChecked =
    document.querySelectorAll('input[name="purpose"]:checked').length > 0;
  const experienceChecked =
    document.querySelectorAll('input[name="experience"]:checked').length > 0;
  const limitChecked =
    document.querySelectorAll('input[name="limit"]:checked').length > 0;

  if (purposeChecked && experienceChecked && limitChecked) {
    nextBtn.classList.remove("off");
    nextBtn.classList.add("on");
    nextBtn.removeAttribute("disabled");
  } else {
    nextBtn.classList.remove("on");
    nextBtn.classList.add("off");
    nextBtn.setAttribute("disabled", "true");
  }
}

// 3. 입력/선택이 바뀔 때마다 실시간으로 세션에 저장 + 검증
document
  .querySelectorAll('input[type="checkbox"], input[type="radio"]')
  .forEach((input) => {
    input.addEventListener("change", function () {
      const selectedPurposes = Array.from(
        document.querySelectorAll('input[name="purpose"]:checked'),
      ).map((el) => el.value);

      const experienceRadio = document.querySelector(
        'input[name="experience"]:checked',
      );
      const experienceFlag = experienceRadio
        ? experienceRadio.value === "있다"
        : false;

      const selectedLimits = Array.from(
        document.querySelectorAll('input[name="limit"]:checked'),
      ).map((el) => el.value);

      // sessionStorage에 즉시 백업 저장
      sessionStorage.setItem(
        "survey_purpose",
        JSON.stringify(selectedPurposes),
      );
      sessionStorage.setItem("survey_experienceFlag", experienceFlag);
      sessionStorage.setItem(
        "survey_constraintTypes",
        JSON.stringify(selectedLimits),
      );

      checkFormValidation();
    });
  });

// 4. '다음' 버튼 클릭 시 이동
nextBtn.addEventListener("click", function () {
  if (!nextBtn.hasAttribute("disabled")) {
    window.location.href = "survey2.html";
  }
});
