const emailInput = document.getElementById("emailInput");
const authRequestBtn = document.getElementById("authRequestBtn");
const codeInput = document.getElementById("codeInput");
const authConfirmBtn = document.getElementById("authConfirmBtn");
const errorMsg = document.getElementById("errorMsg");
const nextButton = document.getElementById("nextButton");
const nextImage = document.getElementById("nextImage");

// 인증번호 요청 및 확인 상태 플래그
let isRequestSent = false;
let isVerified = false;

// 1. 이메일 입력 시 초록색 테두리 및 인증번호 받기 버튼 활성화
emailInput.addEventListener("input", function () {
  if (emailInput.value.trim() !== "") {
    emailInput.classList.add("active");
    authRequestBtn.classList.add("active");
  } else {
    emailInput.classList.remove("active");
    authRequestBtn.classList.remove("active");
  }
});

// 2. 인증번호 입력 시 초록색 테두리 및 인증번호 확인 버튼 활성화
codeInput.addEventListener("input", function () {
  if (codeInput.value.trim() !== "") {
    codeInput.classList.add("active");
    authConfirmBtn.classList.add("active");
  } else {
    codeInput.classList.remove("active");
    authConfirmBtn.classList.remove("active");
  }
});

// 3. '인증번호 받기' 버튼 클릭 시 API 호출
authRequestBtn.addEventListener("click", async function () {
  const email = emailInput.value.trim();

  if (!email) {
    alert("이메일을 입력해주세요.");
    return;
  }

  try {
    authRequestBtn.disabled = true;

    const response = await fetch(
      "https://sprintkr.site/api/v1/mail/verification",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          purpose: "SIGNUP",
        }),
      },
    );

    const data = await response.json();

    if (response.ok && data.isSuccess) {
      alert("인증 코드가 발송되었습니다. 이메일을 확인해주세요.");
      isRequestSent = true;
      codeInput.focus();
    } else {
      if (response.status === 409) {
        alert(data.message || "이미 가입된 이메일입니다.");
      } else if (response.status === 429) {
        alert(
          data.message ||
            "인증 코드 재요청이 너무 잦습니다. 잠시 후 다시 시도해주세요.",
        );
      } else {
        alert(data.message || "인증 코드 발송에 실패했습니다.");
      }
    }
  } catch (error) {
    console.error("통신 에러:", error);
    alert("서버와 통신 중 오류가 발생했습니다.");
  } finally {
    authRequestBtn.disabled = false;
  }
});

// 4. '인증번호 확인' 버튼 클릭 시 서버 API로 실제 검증 수행
authConfirmBtn.addEventListener("click", async function () {
  const email = emailInput.value.trim();
  const userCode = codeInput.value.trim();

  if (!isRequestSent) {
    alert("먼저 인증번호 받기를 진행해주세요.");
    return;
  }

  if (!userCode) {
    errorMsg.textContent = "인증번호를 입력해주세요.";
    errorMsg.classList.add("show");
    return;
  }

  try {
    authConfirmBtn.disabled = true;

    // 💡 purpose를 "SIGN_UP" (언더바 포함)으로 수정
    const response = await fetch(
      "https://sprintkr.site/api/v1/mail/verification/confirm",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          code: userCode,
          purpose: "SIGN_UP",
        }),
      },
    );

    const data = await response.json();

    if (response.ok && data.isSuccess) {
      // ✅ 인증 성공 시
      errorMsg.classList.remove("show");
      isVerified = true;
      nextImage.src = "../images/next_on.png";

      // 서버가 발급해 준 검증 토큰(token)을 세션에 저장 (다음 회원가입 페이지에서 필요할 수 있음)
      if (data.result && data.result.token) {
        sessionStorage.setItem("verificationToken", data.result.token);
      }

      alert("인증이 완료되었습니다.");
    } else {
      // ❌ 인증 실패 시 (틀린 번호, 만료 등)
      errorMsg.textContent = data.message || "인증번호가 일치하지 않습니다.";
      errorMsg.classList.add("show");
      isVerified = false;
      nextImage.src = "../images/next_off.png";
    }
  } catch (error) {
    console.error("통신 에러:", error);
    errorMsg.textContent = "서버와 통신 중 오류가 발생했습니다.";
    errorMsg.classList.add("show");
    isVerified = false;
    nextImage.src = "../images/next_off.png";
  } finally {
    authConfirmBtn.disabled = false;
  }
});

// 5. 다음 버튼 클릭 시 이메일, 인증코드, 토큰을 sessionStorage에 저장 후 이동
nextButton.addEventListener("click", function (e) {
  if (!isVerified) {
    e.preventDefault();
    alert("인증번호 확인이 완료되지 않았습니다.");
  } else {
    sessionStorage.setItem("signupEmail", emailInput.value.trim());
    sessionStorage.setItem("authCode", codeInput.value.trim());
  }
});
