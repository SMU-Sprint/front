const emailInput = document.getElementById("emailInput");
const authRequestBtn = document.getElementById("authRequestBtn");
const codeInput = document.getElementById("codeInput");
const authConfirmBtn = document.getElementById("authConfirmBtn");
const errorMsg = document.getElementById("errorMsg");
const nextButton = document.getElementById("nextButton");
const nextImage = document.getElementById("nextImage");

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

// 2. '인증번호 받기' 버튼 클릭 시 백엔드 API 연동 (이메일 인증 코드 발송)
authRequestBtn.addEventListener("click", async function () {
  if (!authRequestBtn.classList.contains("active")) return;

  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    alert("로그인 정보가 없습니다. 다시 로그인해주세요.");
    window.location.href = "login.html";
    return;
  }

  try {
    authRequestBtn.style.pointerEvents = "none";

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

    const data = await response.json();

    if (response.ok && data.isSuccess) {
      alert("인증 코드가 이메일로 발송되었습니다. (10분 유효)");
    } else {
      alert(data.message || "인증 코드 발송에 실패했습니다.");
    }
  } catch (error) {
    console.error("통신 에러:", error);
    alert("서버와 통신 중 오류가 발생했습니다.");
  } finally {
    authRequestBtn.style.pointerEvents = "auto";
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

let isVerified = false;

// 4. 인증번호 확인 버튼 클릭 시
authConfirmBtn.addEventListener("click", function () {
  const codeVal = codeInput.value.trim();

  if (codeVal !== "") {
    // 사용자가 입력한 코드를 임시 저장 (다음 비밀번호 변경 단계에서 사용)
    sessionStorage.setItem("verify_code", codeVal);
    sessionStorage.setItem("verify_email", emailInput.value.trim());

    errorMsg.classList.remove("show");
    isVerified = true;
    nextImage.src = "../images/next_on.png"; // 다음 버튼 활성화
    alert("인증번호가 임시 확인되었습니다. 다음 버튼을 눌러주세요.");
  } else {
    errorMsg.classList.add("show");
    isVerified = false;
    nextImage.src = "../images/next_off.png";
  }
});

// 5. 다음 버튼 클릭 시
nextButton.addEventListener("click", function (e) {
  if (!isVerified) {
    e.preventDefault();
    alert("인증번호 확인이 필요합니다.");
  }
});
