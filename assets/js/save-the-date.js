document.addEventListener("DOMContentLoaded", () => {
  // Intro card fade-in and flip
  const introCardContainer = document.getElementById("introCard");
  let card;
  let front;
  if (introCardContainer) {
    setTimeout(() => introCardContainer.classList.add("visible"), 3000);

    card = introCardContainer.querySelector(".intro-card");
    front = card?.querySelector(".card-front");
    if (card && front) {
      card.addEventListener("click", () => {
        if (!card.classList.contains("flipped")) {
          card.classList.add("flipped");
        }
      });
    }
  }

  // Can't attend form handling
  const trigger = document.getElementById("showCantAttendForm");
  const backContent = document.getElementById("backContent");
  const formContainer = document.getElementById("cantAttendFormContainer");
  const form = formContainer ? formContainer.querySelector("form") : null;

  if (trigger && backContent && formContainer) {
    trigger.addEventListener("click", () => {
      backContent.style.display = "none";
      formContainer.style.display = "block";
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      try {
        await fetch(form.action, { method: "POST", body: formData, mode: "no-cors" });
        window.location.href = "thankyou.html";
      } catch (err) {
        formContainer.innerHTML =
          '<p class="thank-you-message">Submission failed. Please try again later.</p>';
      }
    });
  }

  // Countdown ticker
  const countdownEl = document.getElementById("countdown");
  if (countdownEl) {
    const target = new Date("2026-09-12T00:00:00");
    const digits = [];
    let timer;

    function adjustCardHeight() {
      if (card && front) {
        card.style.height = front.offsetHeight + "px";
      }
    }

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

      adjustCardHeight();
    }

    setupClock();
    updateClock();
    timer = setInterval(updateClock, 1000);
    window.addEventListener("load", adjustCardHeight);
    window.addEventListener("resize", adjustCardHeight);
  }
});
