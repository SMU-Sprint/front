document.addEventListener("DOMContentLoaded", async function () {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    alert("로그인 정보가 없습니다. 다시 로그인해주세요.");
    window.location.href = "login.html";
    return;
  }

  // 회원 정보 요청과 관계없이 사진 선택 기능은 페이지가 열리자마자 활성화한다.
  const avatarElem = document.querySelector(".avatar");
  const profileImageInput = document.getElementById("profileImageInput");

  function showProfileImage(imageUrl) {
    if (!avatarElem || !imageUrl) return;
    avatarElem.style.backgroundImage = `url("${imageUrl}")`;
    avatarElem.classList.add("has-image");
  }

  const savedProfileImg = localStorage.getItem("user_profile_image");
  showProfileImage(savedProfileImg);

  if (profileImageInput && avatarElem) {
    profileImageInput.addEventListener("change", function (event) {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        alert("이미지 파일을 선택해주세요.");
        event.target.value = "";
        return;
      }

      const reader = new FileReader();
      reader.addEventListener("load", function () {
        const base64Image = reader.result;

        // 저장 용량이 부족하더라도 선택한 사진은 즉시 화면에 보여준다.
        showProfileImage(base64Image);
        try {
          localStorage.setItem("user_profile_image", base64Image);
          alert("프로필 사진이 성공적으로 변경되었습니다!");
        } catch (error) {
          console.error("프로필 사진 저장 실패:", error);
          alert("사진은 적용되었지만 파일이 커서 브라우저에 저장하지 못했습니다.");
        }
      });
      reader.addEventListener("error", function () {
        alert("선택한 사진을 불러오지 못했습니다. 다시 선택해주세요.");
      });
      reader.readAsDataURL(file);
    });
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
  // 2. 선호 운동 정보(지역, 요일, 시간대) 불러오기
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
  // 3. 로그아웃 기능 (인증 토큰만 삭제, 프로필 사진 및 설정은 유지)
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
        // 토큰만 골라서 삭제 (프로필 사진, 운동 지역/요일/시간은 보존됨)
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        sessionStorage.clear();
        window.location.href = "login.html";
      }
    });
  }

  // ==========================================
  // 4. 회원 탈퇴 기능 (탈퇴 시 모든 로컬 데이터 완전히 초기화)
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
          localStorage.clear(); // 탈퇴 시에는 프로필 사진 포함 모든 정보 삭제
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
