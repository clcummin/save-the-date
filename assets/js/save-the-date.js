document.addEventListener('DOMContentLoaded', () => {
  const introCard = document.getElementById('introCard');
  const video = document.querySelector('.background-video video');
  const preCountdown = document.getElementById('preCountdown');

  if (video) {
    video.addEventListener('ended', () => {
      introCard?.classList.add('visible');
    });
  }

  if (preCountdown) {
    let n = 10;
    let timer;
    const render = () => {
      preCountdown.textContent = n;
      preCountdown.style.fontFamily = 'var(--font-heading)';
      preCountdown.style.transition = 'font-size 0.7s var(--ease-med)';
      preCountdown.style.fontSize = `${(11 - n) * (11 - n) * 0.5}rem`;
      if (n === 1) {
        clearInterval(timer);
        preCountdown.classList.add('hidden');
        video?.play();
      } else {
        n--;
      }
    };
    render();
    timer = setInterval(render, 1000);
  } else {
    video?.play();
  }

  if (introCard) {
    const flipCard = introCard.querySelector('.flip-card');
    const front = flipCard?.querySelector('.flip-front');
    const back = flipCard?.querySelector('.flip-back');

    const adjustCardSize = () => {
      if (!flipCard || !front || !back) return;
      const buffer = 20; // Add extra space to prevent text from spilling over
      const width = Math.max(front.scrollWidth, back.scrollWidth) + buffer;
      const height = Math.max(front.scrollHeight, back.scrollHeight) + buffer;
      flipCard.style.width = `${width}px`;
      flipCard.style.height = `${height}px`;
    };

    adjustCardSize();
    window.addEventListener('resize', adjustCardSize);

    const handleFlip = () => {
      introCard.querySelector('.flip-card')?.classList.add('flipped');
      introCard.removeEventListener('click', handleFlip);
    };
    introCard.addEventListener('click', handleFlip);
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
