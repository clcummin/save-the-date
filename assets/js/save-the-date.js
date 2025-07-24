document.addEventListener('DOMContentLoaded', () => {
  const introCard = document.getElementById('introCard');
  if (introCard) {
    setTimeout(() => introCard.classList.add('visible'), 3000);
    introCard.addEventListener('click', () => {
      introCard.querySelector('.flip-card')?.classList.toggle('flipped');
    });
  }

  const countdownEl = document.getElementById('countdown');
  if (countdownEl) {
    const target = new Date('2026-09-12T00:00:00');
    const interval = setInterval(() => {
      const diff = target - Date.now();
      if (diff <= 0) {
        clearInterval(interval);
        countdownEl.textContent = "It's today!";
        return;
      }
      const days = Math.floor(diff / (1000*60*60*24));
      const hours = Math.floor((diff/ (1000*60*60)) % 24);
      const minutes = Math.floor((diff/ (1000*60)) % 60);
      const seconds = Math.floor((diff/1000) % 60);
      countdownEl.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }, 1000);
  }
});
