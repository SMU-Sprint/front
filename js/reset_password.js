const newPassword = document.getElementById("newPassword");
const confirmPassword = document.getElementById("confirmPassword");
const errorMsg = document.getElementById("errorMsg");
const nextButton = document.getElementById("nextButton");
const nextImage = document.getElementById("nextImage");

// 비밀번호 정규식: 영문, 숫자, 특수문자를 모두 포함한 8자 이상
const passwordRegex =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!\%*#?&]{8,}$/;

// 입력창 테두리 및 버튼 상태 제어
function updateState() {
  const val1 = newPassword.value;
  const val2 = confirmPassword.value;

  // 1. 첫 번째 입력창 테두리 제어
  if (val1.trim() !== "") {
    newPassword.classList.add("active");
  } else {
    newPassword.classList.remove("active");
  }

  // 2. 두 번째 입력창 테두리 제어
  if (val2.trim() !== "") {
    confirmPassword.classList.add("active");
  } else {
    confirmPassword.classList.remove("active");
  }

  // 3. 일치 여부 및 버튼 활성화 검증
  const isPasswordValid = passwordRegex.test(val1);
  const isMatch = val1 !== "" && val1 === val2;

  if (val2.trim() !== "" && !isMatch) {
    errorMsg.classList.add("show");
    nextImage.src = "../images/next_off.png";
  } else {
    errorMsg.classList.remove("show");
    // 형식과 확인란이 모두 완벽할 때만 다음 버튼 활성화
    if (isPasswordValid && isMatch) {
      nextImage.src = "../images/next_on.png";
    } else {
      nextImage.src = "../images/next_off.png";
    }
  }
}

newPassword.addEventListener("input", updateState);
confirmPassword.addEventListener("input", updateState);

// '다음' 버튼 클릭 시 비밀번호 변경 PATCH API 연동
nextButton.addEventListener("click", async function (e) {
  e.preventDefault();

  const val1 = newPassword.value;
  const val2 = confirmPassword.value;

  // 💡 조건에 맞지 않을 때 팝업 알림 띄우기
  if (!passwordRegex.test(val1)) {
    alert(
      "비밀번호는 영문, 숫자, 특수문자를 모두 포함한 8자 이상이어야 합니다.",
    );
    newPassword.focus();
    return;
  }

  if (val1 === "" || val1 !== val2) {
    alert("새 비밀번호가 일치하지 않거나 입력되지 않았습니다.");
    return;
  }

  // 세션에서 인증 코드 가져오기
  const verificationCode = sessionStorage.getItem("verify_code");
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    alert("로그인 정보가 없습니다. 다시 로그인해주세요.");
    window.location.href = "login.html";
    return;
  }

  if (!verificationCode) {
    alert("인증 정보가 없습니다. 이메일 인증부터 다시 진행해주세요.");
    window.location.href = "find_password.html";
    return;
  }

  try {
    nextButton.style.pointerEvents = "none";

    // 백엔드 PATCH /api/v1/members/password 호출
    const response = await fetch(
      "https://sprintkr.site/api/v1/members/password",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          code: verificationCode,
          newPassword: val1,
          newPasswordConfirm: val2,
        }),
      },
    );

    const data = await response.json();

    if (response.ok && data.isSuccess) {
      alert("비밀번호가 성공적으로 변경되었습니다!");
      sessionStorage.clear(); // 사용 완료된 세션 정리
      window.location.href = "login.html"; // 로그인 페이지로 이동
    } else {
      alert(data.message || "비밀번호 변경에 실패했습니다.");
    }
  } catch (error) {
    console.error("통신 에러:", error);
    alert("서버와 통신 중 오류가 발생했습니다.");
  } finally {
    nextButton.style.pointerEvents = "auto";
  }
});
