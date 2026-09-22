const nextBtn = document.getElementById("nextBtn");

function checkFormValidation() {
  const vigorousChecked =
    document.querySelectorAll('input[name="vigorous"]:checked').length > 0;
  const moderateChecked =
    document.querySelectorAll('input[name="moderate"]:checked').length > 0;
  const walkingChecked =
    document.querySelectorAll('input[name="walking"]:checked').length > 0;

  if (vigorousChecked && moderateChecked && walkingChecked) {
    nextBtn.classList.remove("off");
    nextBtn.classList.add("on");
    nextBtn.removeAttribute("disabled");
  } else {
    nextBtn.classList.remove("on");
    nextBtn.classList.add("off");
    nextBtn.setAttribute("disabled", "true");
  }
}

document.querySelectorAll('input[type="radio"]').forEach((input) => {
  input.addEventListener("change", checkFormValidation);
});

nextBtn.addEventListener("click", function () {
  if (!nextBtn.hasAttribute("disabled")) {
    const vigorousVal = document.querySelector(
      'input[name="vigorous"]:checked',
    ).value;
    const moderateVal = document.querySelector(
      'input[name="moderate"]:checked',
    ).value;
    const walkingVal = document.querySelector(
      'input[name="walking"]:checked',
    ).value;

    sessionStorage.setItem("survey_vigorousDays", parseInt(vigorousVal, 10));
    sessionStorage.setItem("survey_moderateDays", parseInt(moderateVal, 10));
    sessionStorage.setItem("survey_walkingDays", parseInt(walkingVal, 10));

    window.location.href = "survey4.html";
  }
});
