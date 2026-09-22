const nextBtn = document.getElementById("nextBtn");

function checkFormValidation() {
  const purposeChecked =
    document.querySelectorAll('input[name="purpose"]:checked').length > 0;
  const experienceChecked =
    document.querySelectorAll('input[name="experience"]:checked').length > 0;
  const limitChecked =
    document.querySelectorAll('input[name="limit"]:checked').length > 0;

  if (purposeChecked && experienceChecked && limitChecked) {
    nextBtn.classList.remove("off");
    nextBtn.classList.add("on");
    nextBtn.removeAttribute("disabled");
  } else {
    nextBtn.classList.remove("on");
    nextBtn.classList.add("off");
    nextBtn.setAttribute("disabled", "true");
  }
}

document
  .querySelectorAll('input[type="checkbox"], input[type="radio"]')
  .forEach((input) => {
    input.addEventListener("change", checkFormValidation);
  });

nextBtn.addEventListener("click", function () {
  if (!nextBtn.hasAttribute("disabled")) {
    const selectedPurposes = Array.from(
      document.querySelectorAll('input[name="purpose"]:checked'),
    ).map((el) => el.value);
    const experienceRadio = document.querySelector(
      'input[name="experience"]:checked',
    );
    const experienceFlag = experienceRadio
      ? experienceRadio.value === "있다"
      : false;
    const selectedLimits = Array.from(
      document.querySelectorAll('input[name="limit"]:checked'),
    ).map((el) => el.value);

    sessionStorage.setItem("survey_purpose", JSON.stringify(selectedPurposes));
    sessionStorage.setItem("survey_experienceFlag", experienceFlag);
    sessionStorage.setItem(
      "survey_constraintTypes",
      JSON.stringify(selectedLimits),
    );

    window.location.href = "survey2.html";
  }
});
