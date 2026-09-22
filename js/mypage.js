document.addEventListener("DOMContentLoaded", async function () {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    alert("로그인 정보가 없습니다. 다시 로그인해주세요.");
    window.location.href = "login.html";
    return;
  }

  // ==========================================
  // 1. 회원 기본 정보 조회 및 렌더링 (GET /api/v1/members/me)
  // ==========================================
  try {
    const memberResponse = await fetch(
      "https://sprintkr.site/api/v1/members/me",
      {
        method: "GET",
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const memberData = await memberResponse.json();

    if (memberResponse.ok && memberData.isSuccess && memberData.result) {
      const user = memberData.result;

      // 프로필 카드 데이터 렌더링
      const ageElem = document.getElementById("profileAge");
      const genderElem = document.getElementById("profileGender");
      const heightElem = document.getElementById("profileHeight");
      const weightElem = document.getElementById("profileWeight");

      if (ageElem) ageElem.textContent = user.age ?? "00";

      if (genderElem) {
        let genderText = user.gender;
        if (user.gender === "MALE") genderText = "남성";
        else if (user.gender === "FEMALE") genderText = "여성";
        genderElem.textContent = genderText ?? "성별";
      }

      if (heightElem) heightElem.textContent = user.height ?? "000";
      if (weightElem) weightElem.textContent = user.weight ?? "00";
    }
  } catch (error) {
    console.error("회원 정보 조회 통신 에러:", error);
  }

  // ==========================================
  // 2. 프론트엔드(LocalStorage)에 저장된 운동 지역, 요일, 시간대 불러오기
  // ==========================================
  const savedRegion = localStorage.getItem("user_region");
  const savedDay = localStorage.getItem("user_day");
  const savedTime = localStorage.getItem("user_time");

  const regionElem = document.getElementById("userRegion");
  const dayElem = document.getElementById("userDay");
  const timeElem = document.getElementById("userTime");

  if (regionElem && savedRegion) regionElem.textContent = savedRegion;
  if (dayElem && savedDay) dayElem.textContent = savedDay;
  if (timeElem && savedTime) timeElem.textContent = savedTime;

  // ==========================================
  // 3. 로그아웃 기능
  // ==========================================
  // ==========================================
  // 로그아웃 기능 (수정 버전)
  // ==========================================
  const logoutModal = document.getElementById("logout-modal");
  if (logoutModal) {
    const logoutYesBtn = logoutModal.querySelector(".outline");

    logoutYesBtn.addEventListener("click", async function (e) {
      e.preventDefault();

      try {
        logoutYesBtn.style.pointerEvents = "none";
        await fetch("https://sprintkr.site/api/v1/auth/logout", {
          method: "POST",
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${accessToken}`,
          },
        });
      } catch (error) {
        console.error("로그아웃 통신 에러:", error);
      } finally {
        // 💡 수정: 전체 clear()를 하면 지역/요일/시간대까지 지워지므로,
        // 로그인 인증 정보(accessToken 등)만 골라서 삭제하고 설정 데이터는 유지합니다!
        localStorage.removeItem("accessToken");
        // 만약 리프레시 토큰이나 임시 이름을 로컬스토리지에 따로 저장하셨다면 그것들도 여기서 removeItem 해주세요.

        sessionStorage.clear(); // 세션 저장소는 설문 단계별 임시 데이터이므로 초기화
        window.location.href = "login.html";
      }
    });
  }

  // ==========================================
  // 4. 회원 탈퇴 기능
  // ==========================================
  const withdrawModal = document.getElementById("withdraw-modal");
  if (withdrawModal) {
    const withdrawYesBtn = withdrawModal.querySelector(".outline");

    withdrawYesBtn.addEventListener("click", async function (e) {
      e.preventDefault();

      try {
        withdrawYesBtn.style.pointerEvents = "none";

        const response = await fetch(
          "https://sprintkr.site/api/v1/members/me",
          {
            method: "DELETE",
            headers: {
              accept: "*/*",
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        const data = await response.json();

        if (response.ok && data.isSuccess) {
          alert("회원 탈퇴가 정상적으로 처리되었습니다.");
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = "login.html";
        } else {
          alert(data.message || "회원 탈퇴에 실패했습니다.");
          withdrawYesBtn.style.pointerEvents = "auto";
        }
      } catch (error) {
        console.error("탈퇴 통신 에러:", error);
        alert("서버와 통신 중 오류가 발생했습니다.");
        withdrawYesBtn.style.pointerEvents = "auto";
      }
    });
  }
});
