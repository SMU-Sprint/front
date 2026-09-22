const nextBtn = document.getElementById("nextBtn");

function checkFormValidation() {
  const fatigueChecked =
    document.querySelectorAll('input[name="fatigue"]:checked').length > 0;
  const stairsChecked =
    document.querySelectorAll('input[name="stairs"]:checked').length > 0;
  const walkingChecked =
    document.querySelectorAll('input[name="walking"]:checked').length > 0;
  const weightChecked =
    document.querySelectorAll('input[name="weight"]:checked').length > 0;

  if (fatigueChecked && stairsChecked && walkingChecked && weightChecked) {
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
    const fatigueVal =
      document.querySelector('input[name="fatigue"]:checked').value === "true";
    const stairsVal =
      document.querySelector('input[name="stairs"]:checked').value === "true";
    const walkingVal =
      document.querySelector('input[name="walking"]:checked').value === "true";
    const weightVal =
      document.querySelector('input[name="weight"]:checked').value === "true";

    sessionStorage.setItem("survey_fatigueFlag", fatigueVal);
    sessionStorage.setItem("survey_stairClimbFlag", stairsVal);
    sessionStorage.setItem("survey_walk300mFlag", walkingVal);
    sessionStorage.setItem("survey_weightLossFlag", weightVal);

    window.location.href = "survey5.html";
  }
});
