document.addEventListener('DOMContentLoaded', () => {
  const introCard = document.getElementById('introCard');
  if (introCard) {
    setTimeout(() => introCard.classList.add('visible'), 3000);
    introCard.addEventListener(
      'click',
      () => {
        const card = introCard.querySelector('.flip-card');
        if (card) {
          card.classList.add('flipped');
          // Prevent further flip interactions while allowing back-side buttons
          const front = card.querySelector('.flip-front');
          if (front) front.style.pointerEvents = 'none';
        }
      },
      { once: true }
    );
  }

  const countdownEl = document.getElementById('countdown');
  if (countdownEl) {
    const target = new Date('2026-09-12T00:00:00');
    const render = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        countdownEl.textContent = "It's today!";
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      const tmpl = (value, label, pad = 2) => `
        <div class="flip-group">
          <div class="digit-row">
            ${String(value).padStart(pad, '0')
              .split('')
              .map((d) => `<div class="flip-digit">${d}</div>`)
              .join('')}
          </div>
          <div class="flip-label">${label}</div>
        </div>`;
      countdownEl.innerHTML = `${tmpl(days, 'Days', 3)}<div class="separator">:</div>${tmpl(hours, 'Hours')}<div class="separator">:</div>${tmpl(minutes, 'Minutes')}<div class="separator">:</div>${tmpl(seconds, 'Seconds')}`;
    };
    render();
    setInterval(render, 1000);
  }
});
