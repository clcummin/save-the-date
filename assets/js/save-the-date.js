document.addEventListener("DOMContentLoaded", () => {
  const introCard = document.getElementById("introCard");
  if (introCard) {
    setTimeout(() => introCard.classList.add("visible"), 3000);

    const introLink = introCard.querySelector("a.intro-card");
    if (introLink) {
      introLink.addEventListener("click", (e) => {
        e.preventDefault();
        const url = introLink.getAttribute("href");
        document
          .querySelector(".background-video video")
          ?.classList.add("fade-out");
        document.querySelector(".video-overlay")?.classList.add("fade-out");
        introCard.classList.add("fade-out");
        setTimeout(() => (window.location.href = url), 700);
      });
    }
  }

  const countdownEl = document.getElementById("countdown");
  if (countdownEl) {
    const target = new Date("2026-09-12T00:00:00");
    const digits = [];
    let timer;

    function createDigit() {
      const d = document.createElement("div");
      d.className = "flip-digit";
      d.textContent = "0";
      return d;
    }

    function setupClock() {
      countdownEl.classList.add("flip-clock");
      const groups = [
        { size: 3, label: "Days" },
        { size: 2, label: "Hours" },
        { size: 2, label: "Minutes" },
        { size: 2, label: "Seconds" },
      ];

      groups.forEach((grp, idx) => {
        const groupEl = document.createElement("div");
        groupEl.className = "flip-group";

        const row = document.createElement("div");
        row.className = "digit-row";
        for (let i = 0; i < grp.size; i++) {
          const digit = createDigit();
          digits.push(digit);
          row.appendChild(digit);
        }
        groupEl.appendChild(row);

        const labelEl = document.createElement("div");
        labelEl.className = "flip-label";
        labelEl.textContent = grp.label;
        groupEl.appendChild(labelEl);

        countdownEl.appendChild(groupEl);

        if (idx < groups.length - 1) {
          const sep = document.createElement("span");
          sep.className = "separator";
          sep.textContent = ":";
          countdownEl.appendChild(sep);
        }
      });
    }

    function flipTo(digitEl, newNumber) {
      if (digitEl.textContent === newNumber) return;
      digitEl.textContent = newNumber;
    }

    function updateClock() {
      const diff = target - Date.now();
      if (diff <= 0) {
        clearInterval(timer);
        countdownEl.innerHTML = "It's today!";
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      const str =
        days.toString().padStart(3, "0") +
        hours.toString().padStart(2, "0") +
        minutes.toString().padStart(2, "0") +
        seconds.toString().padStart(2, "0");

      str.split("").forEach((num, idx) => {
        flipTo(digits[idx], num);
      });
    }

    setupClock();
    updateClock();
    timer = setInterval(updateClock, 1000);
  }
});
