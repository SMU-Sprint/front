const locationInput = document.getElementById("locationInput");
const nextBtn = document.getElementById("nextBtn");

// 1. 페이지 로드 시 저장된 데이터 복원
document.addEventListener("DOMContentLoaded", function () {
  // 1-1. 직업 특성 복원
  const savedJob = sessionStorage.getItem("survey_occupationType");
  if (savedJob) {
    document.querySelectorAll('input[name="job"]').forEach((input) => {
      if (input.value === savedJob) input.checked = true;
    });
  }

  // 1-2. 운동 장소 복원
  const savedSpot = sessionStorage.getItem("survey_exerciseSpot");
  if (savedSpot) {
    locationInput.value = savedSpot;
    locationInput.classList.add("active");
  }

  // 1-3. 선호 스포츠 복원 (JSON 배열로 안전하게 복원)
  const savedSports = sessionStorage.getItem("survey_preferredSport");
  if (savedSports) {
    try {
      const sportsArray = JSON.parse(savedSports);
      document.querySelectorAll('input[name="sports"]').forEach((input) => {
        if (sportsArray.includes(input.value)) {
          input.checked = true;
        }
      });
    } catch (e) {
      // 혹시 기존에 단일 문자열로 저장되어 있던 데이터가 있다면 예외 처리
      document.querySelectorAll('input[name="sports"]').forEach((input) => {
        if (input.value === savedSports) input.checked = true;
      });
    }
  }

  checkFormValidation();
});

// 2. 유효성 검사 및 버튼 제어
function checkFormValidation() {
  const jobChecked =
    document.querySelectorAll('input[name="job"]:checked').length > 0;
  const locationVal = locationInput.value.trim() !== "";
  const sportsChecked =
    document.querySelectorAll('input[name="sports"]:checked').length > 0;

  if (jobChecked && locationVal && sportsChecked) {
    nextBtn.classList.remove("off");
    nextBtn.classList.add("on");
    nextBtn.removeAttribute("disabled");
  } else {
    nextBtn.classList.remove("on");
    nextBtn.classList.add("off");
    nextBtn.setAttribute("disabled", "true");
  }
}

// 3. 입력/선택 시 실시간 저장 및 검증
locationInput.addEventListener("input", function () {
  if (this.value.trim() !== "") {
    this.classList.add("active");
  } else {
    this.classList.remove("active");
  }
  saveDataAndValidate();
});

document
  .querySelectorAll('input[type="checkbox"], input[type="radio"]')
  .forEach((input) => {
    input.addEventListener("change", saveDataAndValidate);
  });

function saveDataAndValidate() {
  const jobRadio = document.querySelector('input[name="job"]:checked');
  const selectedSports = Array.from(
    document.querySelectorAll('input[name="sports"]:checked'),
  ).map((el) => el.value);

  sessionStorage.setItem(
    "survey_occupationType",
    jobRadio ? jobRadio.value : "",
  );
  sessionStorage.setItem("survey_exerciseSpot", locationInput.value.trim());

  // 💡 선택한 스포츠들을 배열(JSON) 형태로 안전하게 통째로 저장
  sessionStorage.setItem(
    "survey_preferredSport",
    JSON.stringify(selectedSports),
  );

  checkFormValidation();
}

// 4. '다음' 버튼 클릭 시 이동
nextBtn.addEventListener("click", function () {
  if (!nextBtn.hasAttribute("disabled")) {
    window.location.href = "survey3.html";
  }
});
