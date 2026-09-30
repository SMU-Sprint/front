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
  emailInput.disabled = true; // 이메일 수정 불가 처리 (선택사항)
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

// '다음' 버튼 클릭 시 곧바로 회원가입 API(`/api/v1/members`) 호출
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

  // 비밀번호 유효성 검사 (영문, 숫자, 특수문자 모두 포함, 8자 이상)
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

  // 세션에서 인증 토큰 또는 인증 코드 가져오기
  const verificationToken = sessionStorage.getItem("verificationToken");
  const authCode = sessionStorage.getItem("authCode");
  const sessionEmail = sessionStorage.getItem("signupEmail");

  if (!sessionEmail) {
    alert("세션 정보가 만료되었습니다. 처음부터 다시 진행해주세요.");
    window.location.href = "signup1.html";
    return;
  }

  try {
    nextButton.disabled = true;

    // 💡 중복 확인 API 호출을 제거하고, 곧바로 회원가입 API 호출
    // (백엔드 명세에 따라 필드명이 'name' 또는 'nickname', 'verificationToken' 또는 'code'일 수 있습니다)
    const response = await fetch("https://sprintkr.site/api/v1/members", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: sessionEmail,
        name: nameVal,
        password: pwdVal,
        token: verificationToken || authCode, // 💡 verificationToken -> token 으로 변경
      }),
    });

    const data = await response.json();

    if (response.ok && data.isSuccess) {
      alert("회원가입이 완료되었습니다!");

      // 발급된 로그인 토큰이 있다면 저장 (구조에 맞게 조정)
      if (data.result && data.result.token) {
        localStorage.setItem(
          "accessToken",
          data.result.token.jwtAccessToken || data.result.token,
        );
      }

      // 가입 완료 후 세션 정리
      sessionStorage.clear();

      window.location.href = "signup3.html";
    } else {
      alert(data.message || "회원가입에 실패했습니다.");
    }
  } catch (error) {
    console.error("통신 에러:", error);
    alert("서버와 통신 중 오류가 발생했습니다.");
  } finally {
    nextButton.disabled = false;
  }
});
