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
const profileErrorMsg = document.getElementById("profileErrorMsg");

// 숫자 인풋 목록
const numberInputs = [ageInput, heightInput, weightInput];
const numericRules = {
  age: { label: "나이", min: 1, max: 120, unit: "세" },
  height: { label: "키", min: 50, max: 250, unit: "cm" },
  weight: { label: "몸무게", min: 20, max: 300, unit: "kg" },
};

function showProfileError(message) {
  if (!profileErrorMsg) return;
  profileErrorMsg.textContent = message;
  profileErrorMsg.classList.toggle("show", Boolean(message));
}

function numberFromInput(input) {
  const value = input ? input.value.trim() : "";
  return value === "" ? NaN : Number(value);
}

function validateProfileValues(age, height, weight, region, day, time) {
  const errors = [];
  [
    [age, numericRules.age],
    [height, numericRules.height],
    [weight, numericRules.weight],
  ].forEach(([value, rule]) => {
    if (!Number.isFinite(value)) {
      errors.push(`${rule.label}를 입력해주세요. 정상 범위는 ${rule.min}-${rule.max}${rule.unit}입니다.`);
    } else if (rule === numericRules.age && !Number.isInteger(value)) {
      errors.push("나이는 소수점 없이 정수로 입력해주세요. 정상 범위는 1-120세입니다.");
    } else if (value < rule.min || value > rule.max) {
      errors.push(`${rule.label}는 ${rule.min}-${rule.max}${rule.unit} 범위로 입력해주세요.`);
    }
  });
  if (!region || region.includes("선택")) errors.push("운동 지역을 선택해주세요.");
  if (!day || day.includes("선택")) errors.push("선호하는 운동 요일을 선택해주세요.");
  if (!time || time.includes("선택")) errors.push("선호하는 운동 시간대를 선택해주세요.");
  return errors;
}

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

  // 드롭다운 선택 여부 체크
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

// 드롭다운 버튼을 클릭해서 값이 바뀔 때도 상태 업데이트를 감지
document.querySelectorAll(".select-panel button").forEach((btn) => {
  btn.addEventListener("click", () => {
    setTimeout(updateFormState, 50);
  });
});

// 3. '회원가입하기' 버튼 클릭 시 PATCH API 연동
signupButton.addEventListener("click", async function (e) {
  e.preventDefault();

  const ageVal = numberFromInput(ageInput);
  const heightVal = numberFromInput(heightInput);
  const weightVal = numberFromInput(weightInput);

  const regionVal = regionTrigger ? regionTrigger.textContent.trim() : "";
  const dayVal = dayTrigger ? dayTrigger.textContent.trim() : "";
  const timeVal = timeTrigger ? timeTrigger.textContent.trim() : "";

  const validationErrors = validateProfileValues(
    ageVal,
    heightVal,
    weightVal,
    regionVal,
    dayVal,
    timeVal,
  );
  if (validationErrors.length) {
    showProfileError(validationErrors.join(" "));
    return;
  }

  // 성별 값 결정
  const genderVal = maleBtn.classList.contains("active") ? "MALE" : "FEMALE";

  // 브라우저에 저장된 AccessToken 가져오기
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    showProfileError("로그인 정보가 없습니다. 다시 로그인해주세요.");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1200);
    return;
  }

  // signup2 단계에서 저장해 둔 실제 사용자 이름 가져오기
  const userName =
    sessionStorage.getItem("signupName") ||
    localStorage.getItem("temp_name") ||
    "홍길동";

  try {
    signupButton.style.pointerEvents = "none"; // 중복 클릭 방지

    // 추가 정보(지역, 요일, 시간대)는 로컬스토리지에 백업 저장
    localStorage.setItem("user_region", regionVal);
    localStorage.setItem("user_day", dayVal);
    localStorage.setItem("user_time", timeVal);

    // 백엔드 명세 PATCH /api/v1/members/me 호출 (인증 코드 제거됨)
    const response = await fetch("https://sprintkr.site/api/v1/members/me", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        name: userName,
        height: heightVal,
        weight: weightVal,
        gender: genderVal,
        age: ageVal,
      }),
    });

    const data = await response.json();

    if (response.ok && data.isSuccess) {
      // 사용이 끝난 임시 세션 데이터 정리
      sessionStorage.removeItem("signupName");
      sessionStorage.removeItem("authCode");
      sessionStorage.removeItem("signupEmail");

      alert("사용자 정보 등록이 완료되었습니다!");
      window.location.href = "survey1.html"; // 다음 설문 페이지로 이동
    } else {
      showProfileError(data.message || "정보 등록에 실패했습니다. 입력값을 다시 확인해주세요.");
      signupButton.style.pointerEvents = "auto";
    }
  } catch (error) {
    console.error("통신 에러:", error);
    showProfileError("서버와 통신 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    signupButton.style.pointerEvents = "auto";
  }
});
