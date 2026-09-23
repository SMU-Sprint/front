(() => {
  const triggers = [...document.querySelectorAll(".select-trigger")];
  function close(except) {
    triggers.forEach((trigger) => {
      if (trigger === except) return;
      document.getElementById(trigger.dataset.target).classList.remove("open");
      trigger.setAttribute("aria-expanded", "false");
    });
  }
  triggers.forEach((trigger) => {
    const panel = document.getElementById(trigger.dataset.target);
    const multiple = !panel.classList.contains("region-panel");
    trigger.dataset.placeholder ||= multiple
      ? panel.classList.contains("day-panel")
        ? "요일 선택"
        : "시간 선택"
      : "운동 지역 선택";
    const initial = trigger.textContent.trim().split(/,\s*/);
    panel.querySelectorAll("button").forEach((button) => {
      const value = button.dataset.value || button.textContent.trim();
      button.classList.toggle("selected", initial.includes(value));
      button.setAttribute("aria-pressed", String(initial.includes(value)));
      button.addEventListener("click", () => {
        if (!multiple)
          panel
            .querySelectorAll("button")
            .forEach((b) => b.classList.remove("selected"));
        button.classList.toggle(
          "selected",
          !multiple || !button.classList.contains("selected"),
        );
        const selected = [...panel.querySelectorAll(".selected")].map(
          (b) => b.dataset.value || b.textContent.trim(),
        );
        panel
          .querySelectorAll("button")
          .forEach((b) =>
            b.setAttribute(
              "aria-pressed",
              String(b.classList.contains("selected")),
            ),
          );
        trigger.dataset.values = JSON.stringify(selected);
        trigger.textContent = selected.length
          ? selected.join(", ")
          : trigger.dataset.placeholder;
        trigger.classList.toggle("active", selected.length > 0);
        trigger.dispatchEvent(new Event("change", { bubbles: true }));
        if (!multiple) {
          close();
          trigger.focus();
        }
      });
    });
    trigger.setAttribute("aria-expanded", "false");
    trigger.addEventListener("click", () => {
      const opened = panel.classList.contains("open");
      close();
      panel.classList.toggle("open", !opened);
      trigger.setAttribute("aria-expanded", String(!opened));
    });
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".select-field")) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const active = triggers.find(
        (t) => t.getAttribute("aria-expanded") === "true",
      );
      close();
      active?.focus();
    }
  });
})();
