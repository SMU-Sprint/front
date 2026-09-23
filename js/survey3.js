const nextBtn = document.getElementById("nextBtn");

// 1. 페이지 로드 시 저장된 데이터 복원
document.addEventListener("DOMContentLoaded", function () {
  const savedVigorous = sessionStorage.getItem("survey_vigorousDays");
  if (savedVigorous !== null) {
    document.querySelectorAll('input[name="vigorous"]').forEach((input) => {
      if (input.value === savedVigorous) input.checked = true;
    });
  }

  const savedModerate = sessionStorage.getItem("survey_moderateDays");
  if (savedModerate !== null) {
    document.querySelectorAll('input[name="moderate"]').forEach((input) => {
      if (input.value === savedModerate) input.checked = true;
    });
  }

  const savedWalking = sessionStorage.getItem("survey_walkingDays");
  if (savedWalking !== null) {
    document.querySelectorAll('input[name="walking"]').forEach((input) => {
      if (input.value === savedWalking) input.checked = true;
    });
  }

  checkFormValidation();
});

// 2. 유효성 검사 및 버튼 제어
function checkFormValidation() {
  const vigorousChecked =
    document.querySelectorAll('input[name="vigorous"]:checked').length > 0;
  const moderateChecked =
    document.querySelectorAll('input[name="moderate"]:checked').length > 0;
  const walkingChecked =
    document.querySelectorAll('input[name="walking"]:checked').length > 0;

  if (vigorousChecked && moderateChecked && walkingChecked) {
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
    const vigorousVal = document.querySelector(
      'input[name="vigorous"]:checked',
    );
    const moderateVal = document.querySelector(
      'input[name="moderate"]:checked',
    );
    const walkingVal = document.querySelector('input[name="walking"]:checked');

    if (vigorousVal)
      sessionStorage.setItem(
        "survey_vigorousDays",
        parseInt(vigorousVal.value, 10),
      );
    if (moderateVal)
      sessionStorage.setItem(
        "survey_moderateDays",
        parseInt(moderateVal.value, 10),
      );
    if (walkingVal)
      sessionStorage.setItem(
        "survey_walkingDays",
        parseInt(walkingVal.value, 10),
      );

    checkFormValidation();
  });
});

// 4. '다음' 버튼 클릭 시 이동
nextBtn.addEventListener("click", function () {
  if (!nextBtn.hasAttribute("disabled")) {
    window.location.href = "survey4.html";
  }
});
