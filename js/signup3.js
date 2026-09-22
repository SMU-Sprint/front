const maleBtn = document.getElementById("maleBtn");
const femaleBtn = document.getElementById("femaleBtn");

const ageInput = document.getElementById("ageInput");
const heightInput = document.getElementById("heightInput");
const weightInput = document.getElementById("weightInput");

// 드롭다운 트리거 버튼들 (운동지역, 요일, 시간대)
const regionTrigger = document.querySelector('[data-target="region-panel"]');
const dayTrigger = document.querySelector('[data-target="day-panel"]');
const timeTrigger = document.querySelector('[data-target="time-panel"]');

const signupButton = document.getElementById("signupButton");
const signupImage = document.getElementById("signupImage");

// 숫자 인풋 목록
const numberInputs = [ageInput, heightInput, weightInput];

// 1. 성별 버튼 토글 기능 (기본 남성)
maleBtn.addEventListener("click", function () {
  maleBtn.classList.add("active");
  femaleBtn.classList.remove("active");
});

femaleBtn.addEventListener("click", function () {
  femaleBtn.classList.add("active");
  maleBtn.classList.remove("active");
});

// 2. 입력창 활성화 및 전체 입력 검증 (숫자 인풋 + 드롭다운 선택 여부 체크)
function updateFormState() {
  let allFilled = true;

  // 숫자 인풋 체크
  numberInputs.forEach((input) => {
    if (input.value.trim() !== "") {
      input.classList.add("active");
    } else {
      input.classList.remove("active");
      allFilled = false;
    }
  });

  // 드롭다운 선택 여부 체크 (기본 placeholder 텍스트가 아니면 선택된 것으로 간주)
  const regionSelected =
    regionTrigger && !regionTrigger.classList.contains("placeholder");
  const daySelected =
    dayTrigger && !dayTrigger.classList.contains("placeholder");
  const timeSelected =
    timeTrigger && !timeTrigger.classList.contains("placeholder");

  // 만약 트리거 버튼의 텍스트가 초기 상태이거나 비어있으면 미완료로 처리
  const regionVal = regionTrigger ? regionTrigger.textContent.trim() : "";
  const dayVal = dayTrigger ? dayTrigger.textContent.trim() : "";
  const timeVal = timeTrigger ? timeTrigger.textContent.trim() : "";

  if (!regionVal || regionVal.includes("선택")) allFilled = false;
  if (!dayVal || dayVal.includes("선택")) allFilled = false;
  if (!timeVal || timeVal.includes("선택")) allFilled = false;

  // 모든 조건이 충족되면 회원가입 버튼을 on 이미지로 변경
  if (allFilled) {
    signupImage.src = "../images/signup_on.png";
  } else {
    signupImage.src = "../images/signup_off.png";
  }
}

// 숫자 인풋 입력 시 상태 업데이트
numberInputs.forEach((input) => {
  input.addEventListener("input", updateFormState);
});

// 드롭다운 버튼을 클릭해서 값이 바뀔 때도 상태 업데이트를 감지할 수 있도록 이벤트 위임 또는 감시 설정
document.querySelectorAll(".select-panel button").forEach((btn) => {
  btn.addEventListener("click", () => {
    // DOM이 업데이트된 직후 폼 상태 체크
    setTimeout(updateFormState, 50);
  });
});

// 3. '회원가입하기' 버튼 클릭 시 PATCH API 연동
signupButton.addEventListener("click", async function (e) {
  e.preventDefault();

  const ageVal = parseInt(ageInput.value.trim(), 10);
  const heightVal = parseFloat(heightInput.value.trim());
  const weightVal = parseFloat(weightInput.value.trim());

  const regionVal = regionTrigger ? regionTrigger.textContent.trim() : "";
  const dayVal = dayTrigger ? dayTrigger.textContent.trim() : "";
  const timeVal = timeTrigger ? timeTrigger.textContent.trim() : "";

  if (
    !ageVal ||
    !heightVal ||
    !weightVal ||
    regionVal.includes("선택") ||
    dayVal.includes("선택") ||
    timeVal.includes("선택")
  ) {
    alert("모든 정보를 올바르게 입력 및 선택해주세요.");
    return;
  }

  // 성별 값 결정
  const genderVal = maleBtn.classList.contains("active") ? "MALE" : "FEMALE";

  // 브라우저에 저장된 AccessToken 가져오기
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    alert("로그인 정보가 없습니다. 다시 로그인해주세요.");
    window.location.href = "login.html";
    return;
  }

  try {
    signupButton.style.pointerEvents = "none"; // 중복 클릭 방지

    // 백엔드 명세에 없는 추가 정보(지역, 요일, 시간대)는 로컬스토리지에 백업 저장
    localStorage.setItem("user_region", regionVal);
    localStorage.setItem("user_day", dayVal);
    localStorage.setItem("user_time", timeVal);

    // 백엔드 명세 PATCH /api/v1/members/me 호출
    const response = await fetch("https://sprintkr.site/api/v1/members/me", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        name: localStorage.getItem("temp_name") || "홍길동",
        height: heightVal,
        weight: weightVal,
        gender: genderVal,
        age: ageVal,
      }),
    });

    const data = await response.json();

    if (response.ok && data.isSuccess) {
      alert("사용자 정보 등록이 완료되었습니다!");
      window.location.href = "survey1.html"; // 다음 설문 페이지로 이동
    } else {
      alert(data.message || "정보 등록에 실패했습니다.");
    }
  } catch (error) {
    console.error("통신 에러:", error);
    alert("서버와 통신 중 오류가 발생했습니다.");
  } finally {
    signupButton.style.pointerEvents = "auto";
  }
});
