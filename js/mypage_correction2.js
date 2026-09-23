document.addEventListener("DOMContentLoaded", async function () {
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    alert("로그인 정보가 없습니다. 다시 로그인해주세요.");
    window.location.href = "login.html";
    return;
  }

  let originalName = "홍길동";
  let originalGender = "MALE";

  // 폼 내부의 숫자 입력 인풋들 순서대로 가져오기 (나이, 키, 몸무게 순)
  const numberInputs = document.querySelectorAll(
    ".correction-form input[type='number']",
  );
  const ageInput = numberInputs[0];
  const heightInput = numberInputs[1];
  const weightInput = numberInputs[2];

  // 드롭다운 트리거 버튼들 선택 (운동지역, 요일, 시간대)
  const regionTrigger = document.querySelector('[data-target="region-panel"]');
  const dayTrigger = document.querySelector('[data-target="day-panel"]');
  const timeTrigger = document.querySelector('[data-target="time-panel"]');

  // ==========================================
  // 1. 기존 데이터 불러오기 (서버 회원 정보 + 로컬스토리지 추가 정보)
  // ==========================================
  try {
    const res = await fetch("https://sprintkr.site/api/v1/members/me", {
      method: "GET",
      headers: {
        accept: "*/*",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    if (res.ok && data.isSuccess && data.result) {
      const user = data.result;

      originalName =
        user.name && user.name.trim() !== "" ? user.name : "홍길동";
      originalGender = user.gender || "MALE";

      if (ageInput) ageInput.value = user.age ?? "";
      if (heightInput) heightInput.value = user.height ?? "";
      if (weightInput) weightInput.value = user.weight ?? "";
    }
  } catch (error) {
    console.error("회원 정보 로드 에러:", error);
  }

  // 1-2. 로컬스토리지에 저장되어 있던 운동지역, 요일, 시간대 불러와서 셋팅 및 패널 색상 동기화
  const savedRegion = localStorage.getItem("user_region");
  const savedDay = localStorage.getItem("user_day");
  const savedTime = localStorage.getItem("user_time");

  if (regionTrigger && savedRegion) {
    regionTrigger.textContent = savedRegion;
    regionTrigger.classList.add("active");

    const regionPanel = document.getElementById("region-panel");
    if (regionPanel) {
      regionPanel.querySelectorAll("button").forEach((btn) => {
        const val = btn.dataset.value || btn.textContent.trim();
        if (val === savedRegion) {
          btn.classList.add("selected");
          btn.setAttribute("aria-pressed", "true");
        } else {
          btn.classList.remove("selected");
          btn.setAttribute("aria-pressed", "false");
        }
      });
    }
  }

  if (dayTrigger && savedDay) {
    dayTrigger.textContent = savedDay;
    dayTrigger.classList.add("active");

    const dayArray = savedDay.split(/,\s*/);
    const dayPanel = document.getElementById("day-panel");
    if (dayPanel) {
      dayPanel.querySelectorAll("button").forEach((btn) => {
        const val = btn.dataset.value || btn.textContent.trim();
        if (dayArray.includes(val)) {
          btn.classList.add("selected");
          btn.setAttribute("aria-pressed", "true");
        } else {
          btn.classList.remove("selected");
          btn.setAttribute("aria-pressed", "false");
        }
      });
    }
  }

  if (timeTrigger && savedTime) {
    timeTrigger.textContent = savedTime;
    timeTrigger.classList.add("active");

    const timeArray = savedTime.split(/,\s*/);
    const timePanel = document.getElementById("time-panel");
    if (timePanel) {
      timePanel.querySelectorAll("button").forEach((btn) => {
        const val = btn.dataset.value || btn.textContent.trim();
        if (timeArray.includes(val)) {
          btn.classList.add("selected");
          btn.setAttribute("aria-pressed", "true");
        } else {
          btn.classList.remove("selected");
          btn.setAttribute("aria-pressed", "false");
        }
      });
    }
  }

  // ==========================================
  // 2. '수정완료' 버튼 클릭 시 서버 PATCH 및 로컬스토리지 저장
  // ==========================================
  const submitBtn = document.getElementById("submitBtn");
  if (submitBtn) {
    submitBtn.addEventListener("click", async function (e) {
      e.preventDefault();

      const age = parseInt(ageInput ? ageInput.value : 0, 10);
      const height = parseFloat(heightInput ? heightInput.value : 0);
      const weight = parseFloat(weightInput ? weightInput.value : 0);

      const regionVal = regionTrigger ? regionTrigger.textContent.trim() : "";
      const dayVal = dayTrigger ? dayTrigger.textContent.trim() : "";
      const timeVal = timeTrigger ? timeTrigger.textContent.trim() : "";

      // 💡 1단계(인증 페이지)에서 저장해 둔 이메일 인증 코드를 가져옴
      const verificationCode =
        sessionStorage.getItem("verification_code") || "";

      // 만약 테스트 중이라 세션에 코드가 없다면 임시 코드("123456" 등)나 입력받은 값을 사용할 수 있습니다.
      // 정상 흐름이라면 앞 단계(mypage_correction1.js)에서 인증 성공 시 sessionStorage에 저장해 두어야 합니다.

      const updateData = {
        code: verificationCode, // 👈 필수 파라미터인 인증 코드 추가
        name: originalName || "홍길동",
        height: height,
        weight: weight,
        gender: originalGender,
        age: age,
      };

      console.log("== [서버로 전송하는 회원 수정 데이터] ===", updateData);

      try {
        submitBtn.style.pointerEvents = "none";

        const response = await fetch(
          "https://sprintkr.site/api/v1/members/me",
          {
            method: "PATCH",
            headers: {
              accept: "*/*",
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(updateData),
          },
        );

        const result = await response.json();
        console.log("== [회원 수정 응답 결과] ===", result);

        if (response.ok && result.isSuccess) {
          if (regionVal && !regionVal.includes("선택"))
            localStorage.setItem("user_region", regionVal);
          if (dayVal && !dayVal.includes("선택"))
            localStorage.setItem("user_day", dayVal);
          if (timeVal && !timeVal.includes("선택"))
            localStorage.setItem("user_time", timeVal);

          // 사용이 끝난 인증 코드는 세션에서 제거
          sessionStorage.removeItem("verification_code");

          alert("회원 정보가 성공적으로 수정되었습니다.");
          window.location.href = "mypage.html";
        } else {
          alert(result.message || "정보 수정에 실패했습니다.");
          submitBtn.style.pointerEvents = "auto";
        }
      } catch (error) {
        console.error("회원 정보 수정 통신 에러:", error);
        alert("서버와 통신 중 오류가 발생했습니다.");
        submitBtn.style.pointerEvents = "auto";
      }
    });
  }
});
