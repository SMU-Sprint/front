document.addEventListener("DOMContentLoaded", async function () {
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    alert("로그인 정보가 없습니다. 다시 로그인해주세요.");
    window.location.href = "login.html";
    return;
  }

  const recommendationBox = document.getElementById("recommendationBox");

  try {
    // 스웨거 예시 명세에 딱 맞춘 가장 안전한 기본 DTO 객체
    const surveyData = {
      exercisePurpose: "다이어트", // 스웨거 예시 값
      exercisePurposeEtc: "string",
      exerciseExperienceFlag: true,
      exerciseExperienceDetail: "string",
      preferredSport: "string",
      occupationType: "활동", // 스웨거 예시 값
      vigorousDays: 0,
      vigorousDurationMinutes: 0,
      moderateDays: 0,
      moderateDurationMinutes: 0,
      walkingDays: 0,
      walkingDurationMinutes: 0,
      workStartTime: "string",
      workEndTime: "string",
      exerciseSpot: "종목_특화_운동장", // 스웨거 예시 값 (헬스장 X, 스웨거에 적힌 원본 값)
      exerciseSpotEtc: "string",
      fatigueFlag: true,
      stairClimbFlag: true,
      walk300mFlag: true,
      weightLossFlag: true,
      constraintTypes: ["시간부족"], // 스웨거 예시 값
      constraintEtc: "string",
    };

    console.log("== [서버로 전송하는 스웨거 표준 데이터] ===", surveyData);

    // 3. 설문 저장 API 호출
    const surveyResponse = await fetch(
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

    const surveyResult = await surveyResponse.json();
    console.log("== [설문 저장 응답 결과] ===", surveyResult);

    if (!surveyResponse.ok || !surveyResult.isSuccess) {
      alert(surveyResult.message || "설문 저장에 실패했습니다.");
      return;
    }

    // 4. AI 운동 추천 생성 API 호출
    const recoResponse = await fetch(
      "https://sprintkr.site/api/v1/members/recommendation",
      {
        method: "POST",
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const recoData = await recoResponse.json();
    console.log("== [추천 운동 응답 결과] ===", recoData);

    if (recoResponse.ok && recoData.isSuccess) {
      const recommendations = recoData.result.recommendations;

      let htmlContent = "";
      recommendations.forEach((item, index) => {
        htmlContent += `
          <div class="question-group">
            <p class="question-title">${item.rank}. ${item.exerciseName}</p>
            <p class="recommend-desc"><strong>추천 이유:</strong> ${item.reason}</p>
            <p class="recommend-desc" style="margin-top: 8px; color: #555;"><strong>기대 효과:</strong> ${item.improvements}</p>
          </div>
        `;
        if (index < recommendations.length - 1) {
          htmlContent += `<div class="divider"></div>`;
        }
      });

      recommendationBox.innerHTML = htmlContent;
      sessionStorage.clear(); // 완료 후 세션 정리
    } else {
      alert(recoData.message || "운동 추천을 불러오는 데 실패했습니다.");
    }
  } catch (error) {
    console.error("통신 에러:", error);
    alert("서버와 통신 중 오류가 발생했습니다.");
  }
});

// 하단 '완료' 버튼 클릭 시 메인 화면으로 이동
const completeBtn = document.getElementById("completeBtn");
if (completeBtn) {
  completeBtn.addEventListener("click", function () {
    window.location.href = "main.html";
  });
}
