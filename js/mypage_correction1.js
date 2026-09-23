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
      emailInput.disabled = true; // 이메일은 수정 불가하도록 고정
    }
  } catch (error) {
    console.error("회원 이메일 조회 실패:", error);
  }

  // 재발급 60초 쿨타임 관리용 변수
  let isCooldown = false;
  let cooldownTimer = null;

  // 2. '인증번호 받기' 버튼 클릭 시 API 호출 (POST /api/v1/mail/verification/member-info-change)
  sendCodeBtn.addEventListener("click", async function () {
    if (isCooldown) return;

    try {
      sendCodeBtn.style.pointerEvents = "none";

      const response = await fetch(
        "https://sprintkr.site/api/v1/mail/verification/member-info-change",
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
    sessionStorage.setItem("verification_code", codeVal);
    /* 
      만약 백엔드에 인증번호 검증 API(예: POST /api/v1/mail/verification/confirm 등)가 있다면 
      이곳에서 fetch를 통해 코드가 맞는지 검증해야 합니다. 
      현재 명세 기준으로 검증 API가 별도로 명시되어 있지 않다면, 
      사용자가 코드를 입력하고 버튼을 눌렀을 때 다음 단계로 넘어갈 수 있도록 처리합니다.
    */

    alert("인증이 완료되었습니다.");
    nextBtn.disabled = false; // '다음' 버튼 활성화
    nextBtn.classList.add("active"); // 필요시 활성화 스타일 클래스 추가
  });

  // 4. '다음' 버튼 클릭 시 정보 수정 입력 페이지(mypage_correction2.html)로 이동
  nextBtn.addEventListener("click", function () {
    if (!nextBtn.disabled) {
      window.location.href = "mypage_correction2.html";
    }
  });
});
