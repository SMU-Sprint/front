const maleBtn = document.getElementById("maleBtn");
const femaleBtn = document.getElementById("femaleBtn");

const ageInput = document.getElementById("ageInput");
const heightInput = document.getElementById("heightInput");
const weightInput = document.getElementById("weightInput");
const regionInput = document.getElementById("regionInput");
const dayInput = document.getElementById("dayInput");
const timeInput = document.getElementById("timeInput");

const signupButton = document.getElementById("signupButton");
const signupImage = document.getElementById("signupImage");

const inputs = [
  ageInput,
  heightInput,
  weightInput,
  regionInput,
  dayInput,
  timeInput,
];

// 1. 성별 버튼 토글 기능 (기본 남성)
maleBtn.addEventListener("click", function () {
  maleBtn.classList.add("active");
  femaleBtn.classList.remove("active");
});

femaleBtn.addEventListener("click", function () {
  femaleBtn.classList.add("active");
  maleBtn.classList.remove("active");
});

// 2. 입력창 활성화 및 전체 입력 검증
function updateFormState() {
  let allFilled = true;

  inputs.forEach((input) => {
    if (input.value.trim() !== "") {
      input.classList.add("active");
    } else {
      input.classList.remove("active");
      allFilled = false;
    }
  });

  // 6칸 모두 입력되었을 때 회원가입 버튼을 on 이미지로 변경
  if (allFilled) {
    signupImage.src = "../images/signup_on.png";
  } else {
    signupImage.src = "../images/signup_off.png";
  }
}

inputs.forEach((input) => {
  input.addEventListener("input", updateFormState);
});

// 3. '회원가입하기' 버튼 클릭 시 PATCH API 연동
signupButton.addEventListener("click", async function (e) {
  e.preventDefault();

  let allFilled = inputs.every((input) => input.value.trim() !== "");
  if (!allFilled) {
    alert("모든 정보를 입력해주세요.");
    return;
  }

  // 성별 값 결정 (남성이면 MALE, 여성이면 FEMALE)
  const genderVal = maleBtn.classList.contains("active") ? "MALE" : "FEMALE";

  const ageVal = parseInt(ageInput.value.trim(), 10);
  const heightVal = parseFloat(heightInput.value.trim());
  const weightVal = parseFloat(weightInput.value.trim());

  // 브라우저에 저장된 AccessToken 가져오기
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    alert("로그인 정보가 없습니다. 다시 로그인해주세요.");
    window.location.href = "login.html";
    return;
  }

  try {
    signupButton.style.pointerEvents = "none"; // 중복 클릭 방지

    // 백엔드 명세 PATCH /api/v1/members/me 호출
    const response = await fetch("https://sprintkr.site/api/v1/members/me", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`, // 토큰 첨부
      },
      body: JSON.stringify({
        name: "홍길동", // 필요시 회원가입 때 저장해 둔 이름으로 변경 가능
        height: heightVal,
        weight: weightVal,
        gender: genderVal,
        age: ageVal,
      }),
    });

    const data = await response.json();

    if (response.ok && data.isSuccess) {
      alert("사용자 정보 등록이 완료되었습니다!");
      window.location.href = "survey1.html"; // 다음 페이지로 이동
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
