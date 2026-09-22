const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const nextImage = document.getElementById("nextImage");
const nextButton = document.getElementById("nextButton");
const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");

// 1. 입력할 때마다 버튼 이미지를 on/off로 전환
function updateButtonState() {
  if (emailInput.value.trim() !== "" && passwordInput.value.trim() !== "") {
    nextImage.src = "../images/next_on.png";
  } else {
    nextImage.src = "../images/next_off.png";
    // 입력창이 다시 비워지면 에러 메시지 숨김
    emailError.classList.remove("show");
    passwordError.classList.remove("show");
  }
}

emailInput.addEventListener("input", updateButtonState);
passwordInput.addEventListener("input", updateButtonState);

// 2. '다음(로그인)' 버튼을 눌렀을 때 백엔드 API 연동
nextButton.addEventListener("click", async function (e) {
  e.preventDefault(); // 기본 링크 이동 막기

  const emailVal = emailInput.value.trim();
  const passwordVal = passwordInput.value.trim();

  // 입력값이 비어있으면 동작 안 함
  if (emailVal === "" || passwordVal === "") {
    return;
  }

  try {
    nextButton.style.pointerEvents = "none"; // 중복 클릭 방지

    // 백엔드 로그인 API 호출
    const response = await fetch("https://sprintkr.site/api/v1/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: emailVal,
        password: passwordVal,
      }),
    });

    const data = await response.json();

    if (response.ok && data.isSuccess) {
      // 로그인 성공 시 발급된 AccessToken 및 RefreshToken 저장
      if (data.result && data.result.token) {
        localStorage.setItem("accessToken", data.result.token.jwtAccessToken);
        localStorage.setItem("refreshToken", data.result.token.jwtRefreshToken);
      }

      alert("로그인 성공!");
      window.location.href = "main.html"; // 메인 페이지로 이동
    } else {
      // 서버에서 전달한 에러 메시지 처리 (401 이메일/비밀번호 불일치 등)
      alert(data.message || "이메일 또는 비밀번호가 일치하지 않습니다.");

      // UI 상에서 에러 표시
      emailError.classList.add("show");
      passwordError.classList.add("show");
    }
  } catch (error) {
    console.error("통신 에러:", error);
    alert("서버와 통신 중 오류가 발생했습니다.");
  } finally {
    nextButton.style.pointerEvents = "auto";
  }
});
