const locationInput = document.getElementById("locationInput");
const nextBtn = document.getElementById("nextBtn");

function checkFormValidation() {
  const jobChecked =
    document.querySelectorAll('input[name="job"]:checked').length > 0;
  const locationVal = locationInput.value.trim() !== "";
  const sportsChecked =
    document.querySelectorAll('input[name="sports"]:checked').length > 0;

  if (jobChecked && locationVal && sportsChecked) {
    nextBtn.classList.remove("off");
    nextBtn.classList.add("on");
    nextBtn.removeAttribute("disabled");
  } else {
    nextBtn.classList.remove("on");
    nextBtn.classList.add("off");
    nextBtn.setAttribute("disabled", "true");
  }
}

locationInput.addEventListener("input", function () {
  if (this.value.trim() !== "") {
    this.classList.add("active");
  } else {
    this.classList.remove("active");
  }
  checkFormValidation();
});

document
  .querySelectorAll('input[type="checkbox"], input[type="radio"]')
  .forEach((input) => {
    input.addEventListener("change", checkFormValidation);
  });

nextBtn.addEventListener("click", function () {
  if (!nextBtn.hasAttribute("disabled")) {
    const jobRadio = document.querySelector('input[name="job"]:checked');
    const selectedSports = Array.from(
      document.querySelectorAll('input[name="sports"]:checked'),
    ).map((el) => el.value);

    sessionStorage.setItem(
      "survey_occupationType",
      jobRadio ? jobRadio.value : "",
    );
    sessionStorage.setItem("survey_exerciseSpot", locationInput.value.trim());
    sessionStorage.setItem("survey_preferredSport", selectedSports[0] || ""); // 단일 대표값 또는 배열 저장

    window.location.href = "survey3.html";
  }
});
