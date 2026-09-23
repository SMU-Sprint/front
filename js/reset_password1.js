document.addEventListener("DOMContentLoaded", async function () {
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    alert("로그인 정보가 없습니다. 다시 로그인해주세요.");
    window.location.href = "login.html";
    return;
  }

  const emailInput = document.getElementById("email");
  const sendCodeBtn = document.getElementById("send-code-btn");
  const verificationCodeInput = document.getElementById("verification-code");
  const verifyCodeBtn = document.getElementById("verify-code-btn");
  const nextBtn = document.getElementById("next-btn");

  // 1. 페이지 진입 시 현재 로그인된 회원의 이메일 자동 조회하여 input에 세팅
  try {
    const res = await fetch("https://sprintkr.site/api/v1/members/me", {
      method: "GET",
      headers: {
        accept: "*/*",
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const data = await res.json();
    if (res.ok && data.isSuccess && data.result && data.result.email) {
      emailInput.value = data.result.email;
      emailInput.disabled = true; // 이메일 수정 불가 고정
    }
  } catch (error) {
    console.error("회원 이메일 조회 실패:", error);
  }

  // 재발급 60초 쿨타임 관리용 변수
  let isCooldown = false;
  let cooldownTimer = null;

  // 2. '인증번호 받기' 버튼 클릭 시 비밀번호 변경 이메일 인증 API 호출
  sendCodeBtn.addEventListener("click", async function () {
    if (isCooldown) return;

    try {
      sendCodeBtn.style.pointerEvents = "none";

      // 💡 올바른 비밀번호 변경 메일 인증 API 엔드포인트 연동
      const response = await fetch(
        "https://sprintkr.site/api/v1/mail/verification/password-change",
        {
          method: "POST",
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const result = await response.json();

      if (response.ok && result.isSuccess) {
        alert("인증 코드가 이메일로 발송되었습니다. (10분 유효)");

        // 입력창 및 확인 버튼 활성화
        verificationCodeInput.disabled = false;
        verifyCodeBtn.disabled = false;
        verificationCodeInput.focus();

        // 60초 쿨타임 시작 (429 에러 방지)
        isCooldown = true;
        let timeLeft = 60;
        sendCodeBtn.textContent = `${timeLeft}초 후 재발급`;

        cooldownTimer = setInterval(() => {
          timeLeft--;
          if (timeLeft > 0) {
            sendCodeBtn.textContent = `${timeLeft}초 후 재발급`;
          } else {
            clearInterval(cooldownTimer);
            isCooldown = false;
            sendCodeBtn.textContent = "인증번호 재발급";
            sendCodeBtn.style.pointerEvents = "auto";
          }
        }, 1000);
      } else {
        if (response.status === 429) {
          alert("인증 코드 재요청은 60초에 한 번만 가능합니다.");
        } else {
          alert(result.message || "인증 코드 발송에 실패했습니다.");
        }
        sendCodeBtn.style.pointerEvents = "auto";
      }
    } catch (error) {
      console.error("인증 코드 발송 통신 에러:", error);
      alert("서버와 통신 중 오류가 발생했습니다.");
      sendCodeBtn.style.pointerEvents = "auto";
    }
  });

  // 3. '인증번호 확인' 버튼 클릭 이벤트
  verifyCodeBtn.addEventListener("click", function () {
    const codeVal = verificationCodeInput.value.trim();
    if (!codeVal) {
      alert("인증번호를 입력해주세요.");
      verificationCodeInput.focus();
      return;
    }

    // 다음 비밀번호 변경 단계에서 사용할 수 있도록 세션에 인증 코드 저장
    sessionStorage.setItem("password_change_code", codeVal);

    alert("인증이 완료되었습니다.");
    nextBtn.disabled = false; // '다음' 버튼 활성화
    nextBtn.classList.add("active");
  });

  // 4. '다음' 버튼 클릭 시 새 비밀번호 설정 페이지(reset_password.html)로 이동
  nextBtn.addEventListener("click", function () {
    if (!nextBtn.disabled) {
      window.location.href = "reset_password.html";
    }
  });
});
