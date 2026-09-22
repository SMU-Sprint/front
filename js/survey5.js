const completeBtn = document.getElementById("completeBtn");

completeBtn.addEventListener("click", async function () {
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    alert("로그인 정보가 없습니다. 다시 로그인해주세요.");
    window.location.href = "login.html";
    return;
  }

  // 💡 백엔드 스웨거 명세의 성공 예시와 100% 일치하는 테스트 데이터
  const surveyData = {
    exercisePurpose: "다이어트",
    exercisePurposeEtc: "string",
    exerciseExperienceFlag: true,
    exerciseExperienceDetail: "string",
    preferredSport: "string",
    occupationType: "활동",
    vigorousDays: 0,
    vigorousDurationMinutes: 0,
    moderateDays: 0,
    moderateDurationMinutes: 0,
    walkingDays: 0,
    walkingDurationMinutes: 0,
    workStartTime: "09:00:00",
    workEndTime: "18:00:00",
    exerciseSpot: "종목_특화_운동장",
    exerciseSpotEtc: "string",
    fatigueFlag: true,
    stairClimbFlag: true,
    walk300mFlag: true,
    weightLossFlag: true,
    constraintTypes: ["시간부족"],
    constraintEtc: "string",
  };

  try {
    completeBtn.style.pointerEvents = "none";

    const response = await fetch(
      "https://sprintkr.site/api/v1/members/survey",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(surveyData),
      },
    );

    const data = await response.json();

    if (response.ok && data.isSuccess) {
      alert("설문 작성이 완료되었습니다! (테스트 성공)");
      sessionStorage.clear();
      window.location.href = "main.html";
    } else {
      alert(data.message || "설문 저장에 실패했습니다.");
      completeBtn.style.pointerEvents = "auto";
    }
  } catch (error) {
    console.error("통신 에러:", error);
    alert("서버와 통신 중 오류가 발생했습니다.");
    completeBtn.style.pointerEvents = "auto";
  }
});
