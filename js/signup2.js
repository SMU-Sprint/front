const emailInput = document.getElementById("emailInput");
const nameInput = document.getElementById("nameInput");
const passwordInput = document.getElementById("passwordInput");
const confirmInput = document.getElementById("confirmInput");
const privacyCheck = document.getElementById("privacyCheck");
const locationCheck = document.getElementById("locationCheck");

const errorMsg = document.getElementById("errorMsg");
const nextButton = document.getElementById("nextButton");
const nextImage = document.getElementById("nextImage");

const inputs = [emailInput, nameInput, passwordInput, confirmInput];

// 이전 페이지(첫 번째 단계)에서 저장해 둔 이메일이 있다면 자동으로 채워넣기
const savedEmail = sessionStorage.getItem("signupEmail");
if (savedEmail) {
  emailInput.value = savedEmail;
  emailInput.classList.add("active");
}

function updateFormState() {
  inputs.forEach((input) => {
    if (input.value.trim() !== "") {
      input.classList.add("active");
    } else {
      input.classList.remove("active");
    }
  });

  const pwdVal = passwordInput.value.trim();
  const confirmVal = confirmInput.value.trim();
  const isPrivacyChecked = privacyCheck.checked;
  const isLocationChecked = locationCheck.checked;

  // 비밀번호 일치 여부 실시간 검증
  if (confirmVal !== "" && pwdVal !== confirmVal) {
    errorMsg.classList.add("show");
  } else {
    errorMsg.classList.remove("show");
  }

  // 모든 조건 충족 시 다음 버튼 활성화 이미지로 변경
  if (
    emailInput.value.trim() !== "" &&
    nameInput.value.trim() !== "" &&
    pwdVal !== "" &&
    confirmVal !== "" &&
    pwdVal === confirmVal &&
    isPrivacyChecked &&
    isLocationChecked
  ) {
    nextImage.src = "../images/next_on.png";
  } else {
    nextImage.src = "../images/next_off.png";
  }
}

// 이벤트 리스너 등록
inputs.forEach((input) => {
  input.addEventListener("input", updateFormState);
});
privacyCheck.addEventListener("change", updateFormState);
locationCheck.addEventListener("change", updateFormState);

updateFormState();

// '다음' 버튼 클릭 시 회원가입 API(`/api/v1/members`) 호출
// '다음' 버튼 클릭 시 회원가입 API(`/api/v1/members`) 호출
nextButton.addEventListener("click", async function (e) {
  e.preventDefault();

  const emailVal = emailInput.value.trim();
  const nameVal = nameInput.value.trim();
  const pwdVal = passwordInput.value.trim();
  const confirmVal = confirmInput.value.trim();

  // 기본 빈값 및 동의 체크 검사
  if (
    emailVal === "" ||
    nameVal === "" ||
    pwdVal === "" ||
    !privacyCheck.checked ||
    !locationCheck.checked
  ) {
    alert("입력 정보를 다시 확인해주세요.");
    return;
  }

  // 💡 비밀번호 유효성 검사 추가 (영문, 숫자, 특수문자 모두 포함, 8자 이상)
  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  if (!passwordRegex.test(pwdVal)) {
    alert(
      "비밀번호는 영문, 숫자, 특수문자를 모두 포함한 8자 이상이어야 합니다.",
    );
    passwordInput.focus();
    return;
  }

  // 비밀번호 확인 일치 검사
  if (pwdVal !== confirmVal) {
    alert("비밀번호가 일치하지 않습니다.");
    confirmInput.focus();
    return;
  }

  // 세션에서 이메일과 인증 코드 가져오기
  const authCode = sessionStorage.getItem("authCode");
  const sessionEmail = sessionStorage.getItem("signupEmail");

  if (!authCode || !sessionEmail) {
    alert("인증 정보가 없습니다. 첫 페이지에서 인증을 다시 진행해주세요.");
    window.location.href = "signup1.html";
    return;
  }

  try {
    nextButton.disabled = true;

    // 백엔드 스웨거 명세에 맞추어 email, password, code 전송
    const response = await fetch("https://sprintkr.site/api/v1/members", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: sessionEmail,
        password: pwdVal,
        code: authCode,
      }),
    });

    const data = await response.json();

    if (response.ok && data.isSuccess) {
      alert("회원가입이 완료되었습니다!");

      // 발급된 토큰 저장
      if (data.result && data.result.token) {
        localStorage.setItem("accessToken", data.result.token.jwtAccessToken);
        localStorage.setItem("refreshToken", data.result.token.jwtRefreshToken);
      }

      window.location.href = "signup3.html";
    } else {
      // 서버에서 보내주는 에러 메시지 출력 (예: 인증 코드 오류 등)
      alert(data.message || "회원가입에 실패했습니다.");
    }
  } catch (error) {
    console.error("통신 에러:", error);
    alert("서버와 통신 중 오류가 발생했습니다.");
  } finally {
    nextButton.disabled = false;
  }
});
