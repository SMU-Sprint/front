const emailInput = document.getElementById("emailInput");
const authRequestBtn = document.getElementById("authRequestBtn");
const codeInput = document.getElementById("codeInput");
const authConfirmBtn = document.getElementById("authConfirmBtn");
const errorMsg = document.getElementById("errorMsg");
const nextButton = document.getElementById("nextButton");
const nextImage = document.getElementById("nextImage");

let isRequestSent = false;
let isVerified = false;

// 1. 이메일 입력 시 초록색 테두리 변경 및 '인증번호 받기' 버튼 활성화
emailInput.addEventListener("input", function () {
  if (emailInput.value.trim() !== "") {
    emailInput.classList.add("active");
    authRequestBtn.classList.add("active");
  } else {
    emailInput.classList.remove("active");
    authRequestBtn.classList.remove("active");
  }
});

// 2. '인증번호 받기' 버튼 클릭 시 비밀번호 찾기 이메일 인증 API 연동
authRequestBtn.addEventListener("click", async function () {
  const emailVal = emailInput.value.trim();

  if (!emailVal) {
    alert("이메일을 입력해주세요.");
    return;
  }

  try {
    authRequestBtn.disabled = true;

    const response = await fetch(
      "https://sprintkr.site/api/v1/mail/verification/find-password",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
        },
        body: JSON.stringify({
          email: emailVal,
        }),
      },
    );

    const data = await response.json();

    if (response.ok && data.isSuccess) {
      alert("인증 코드가 이메일로 발송되었습니다. (10분 유효)");
      isRequestSent = true;
      codeInput.focus();
    } else {
      if (response.status === 404) {
        alert(data.message || "가입되지 않은 이메일입니다.");
      } else if (response.status === 429) {
        alert("인증 코드 재요청은 60초에 한 번만 가능합니다.");
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

// 3. 인증번호 입력 시 초록색 테두리 변경 및 '인증번호 확인' 버튼 활성화
codeInput.addEventListener("input", function () {
  if (codeInput.value.trim() !== "") {
    codeInput.classList.add("active");
    authConfirmBtn.classList.add("active");
  } else {
    codeInput.classList.remove("active");
    authConfirmBtn.classList.remove("active");
  }
});

// 4. 인증번호 확인 버튼 클릭 시 (로컬 상에서 우선 완료 처리)
authConfirmBtn.addEventListener("click", function () {
  const userCode = codeInput.value.trim();

  if (!isRequestSent) {
    alert("먼저 인증번호 받기를 진행해주세요.");
    return;
  }

  if (userCode !== "") {
    errorMsg.classList.remove("show");
    isVerified = true;
    nextImage.src = "../images/next_on.png"; // 다음 버튼 활성화 이미지
    alert(
      "인증번호가 확인되었습니다. 다음 버튼을 눌러 임시 비밀번호를 발급받으세요.",
    );
  } else {
    errorMsg.classList.add("show");
    isVerified = false;
    nextImage.src = "../images/next_off.png";
  }
});

// 5. 다음 버튼 클릭 시 비밀번호 리셋 API(`/api/v1/members/password/reset`) 호출
nextButton.addEventListener("click", async function (e) {
  e.preventDefault();

  if (!isVerified) {
    alert("인증번호 확인이 필요합니다.");
    return;
  }

  const emailVal = emailInput.value.trim();
  const codeVal = codeInput.value.trim();

  try {
    nextButton.style.pointerEvents = "none";

    const response = await fetch(
      "https://sprintkr.site/api/v1/members/password/reset",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
        },
        body: JSON.stringify({
          email: emailVal,
          code: codeVal,
        }),
      },
    );

    const data = await response.json();

    if (response.ok && data.isSuccess) {
      alert(
        "임시 비밀번호가 이메일로 발급되었습니다! 로그인 화면으로 이동합니다.",
      );
      window.location.href = "login.html"; // 발급 완료 후 로그인 페이지로 이동
    } else {
      if (response.status === 400) {
        alert("인증 코드가 만렸거나 일치하지 않습니다.");
      } else if (response.status === 404) {
        alert("발급된 인증 코드가 없거나 회원을 찾을 수 없습니다.");
      } else {
        alert(data.message || "임시 비밀번호 발급에 실패했습니다.");
      }
      nextButton.style.pointerEvents = "auto";
    }
  } catch (error) {
    console.error("통신 에러:", error);
    alert("서버와 통신 중 오류가 발생했습니다.");
    nextButton.style.pointerEvents = "auto";
  }
});
