const API_BASE_URL = "https://sprintkr.site/api/v1";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeRecommendations(data) {
  const result = data?.result ?? data?.data ?? data;
  const candidates = Array.isArray(result)
    ? result
    : result?.recommendations ||
      result?.recommendationList ||
      result?.exercises ||
      result?.items ||
      [];

  return (Array.isArray(candidates) ? candidates : [candidates])
    .filter(Boolean)
    .map((item, index) => ({
      rank: item.rank ?? index + 1,
      exerciseName:
        item.exerciseName ||
        item.name ||
        item.sportName ||
        item.exercise ||
        "추천 운동",
      reason: item.reason || item.recommendReason || item.description || "",
      improvements:
        item.improvements ||
        item.expectedEffect ||
        item.effect ||
        item.benefit ||
        "",
    }));
}

function renderLoading(recommendationBox) {
  recommendationBox.innerHTML = `
    <div class="question-group">
      <p class="question-title">AI 운동 추천을 불러오는 중입니다...</p>
      <p class="recommend-desc">잠시만 기다려 주세요.</p>
    </div>
  `;
}

function renderError(recommendationBox, message) {
  recommendationBox.innerHTML = `
    <div class="question-group">
      <p class="question-title">운동 추천을 불러오지 못했습니다.</p>
      <p class="recommend-desc">${escapeHtml(message)}</p>
    </div>
  `;
}

function renderRecommendations(recommendationBox, recommendations) {
  if (!recommendations.length) {
    renderError(recommendationBox, "추천 운동 결과가 비어 있습니다.");
    return;
  }

  recommendationBox.innerHTML = recommendations
    .map(
      (item, index) => `
        <div class="question-group">
          <p class="question-title">${escapeHtml(item.rank)}. ${escapeHtml(
            item.exerciseName,
          )}</p>
          ${
            item.reason
              ? `<p class="recommend-desc"><strong>추천 이유:</strong> ${escapeHtml(
                  item.reason,
                )}</p>`
              : ""
          }
          ${
            item.improvements
              ? `<p class="recommend-desc recommend-effect"><strong>기대 효과:</strong> ${escapeHtml(
                  item.improvements,
                )}</p>`
              : ""
          }
        </div>
        ${index < recommendations.length - 1 ? '<div class="divider"></div>' : ""}
      `,
    )
    .join("");
}

async function loadRecommendation() {
  const accessToken = localStorage.getItem("accessToken");
  const recommendationBox = document.getElementById("recommendationBox");
  if (!recommendationBox) return;

  if (!accessToken) {
    alert("로그인 정보가 없습니다. 다시 로그인해주세요.");
    window.location.href = "login.html";
    return;
  }

  renderLoading(recommendationBox);

  try {
    const response = await fetch(`${API_BASE_URL}/members/recommendation`, {
      method: "POST",
      headers: {
        accept: "*/*",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = {};
    }
    console.log("== [추천 운동 응답 결과] ==", data);

    if (!response.ok || data.isSuccess === false) {
      const error = new Error(
        data.message || "운동 추천을 불러오는 데 실패했습니다.",
      );
      error.status = response.status;
      throw error;
    }

    renderRecommendations(recommendationBox, normalizeRecommendations(data));
    sessionStorage.removeItem("survey_submitted");
  } catch (error) {
    console.error("추천 운동 통신 에러:", error);
    if (error.status === 401) {
      localStorage.removeItem("accessToken");
      alert("로그인이 만료되었습니다. 다시 로그인해 주세요.");
      window.location.href = "login.html";
      return;
    }
    renderError(
      recommendationBox,
      error.message || "서버와 통신 중 오류가 발생했습니다.",
    );
  }
}

document.addEventListener("DOMContentLoaded", loadRecommendation);

const completeBtn = document.getElementById("completeBtn");
if (completeBtn) {
  completeBtn.addEventListener("click", function () {
    window.location.href = "main.html";
  });
}
