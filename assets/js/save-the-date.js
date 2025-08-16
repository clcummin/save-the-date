document.addEventListener('DOMContentLoaded', () => {
  const introCard = document.getElementById('introCard');
  const video = document.querySelector('.background-video video');
  const preCountdown = document.getElementById('preCountdown');
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playBeat = () => {
    const ctx = audioCtx;
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(1.5, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.start(now);
    osc.stop(now + 0.3);
  };

  if (video) {
    video.addEventListener('ended', () => {
      introCard?.classList.add('visible');
    });
  }

  if (preCountdown && video) {
    preCountdown.textContent = 'Tap to Start';
    preCountdown.classList.add('start-prompt');
    const start = () => {
      audioCtx.resume();
      preCountdown.classList.remove('start-prompt');
      preCountdown.removeEventListener('click', start);

      // Prime video playback within a user gesture so it can later play with sound
      video.muted = true;
      const prime = video.play();
      if (prime !== undefined) {
        prime
          .then(() => {
            video.pause();
            video.currentTime = 0;
          })
          .catch(() => {});
      }

      let n = 10;
      const base = window.innerWidth < 600 ? 0.35 : 0.5;
      preCountdown.style.fontFamily = 'var(--font-heading)';
      preCountdown.textContent = n;
      preCountdown.style.fontSize = `${(11 - n) * (11 - n) * base}rem`;
      playBeat();

      // Enable transition after initial size is applied so first number doesn't animate
      requestAnimationFrame(() => {
        preCountdown.style.transition = 'font-size 0.7s var(--ease-med)';
      });

      const timer = setInterval(() => {
        n--;
        preCountdown.textContent = n;
        preCountdown.style.fontSize = `${(11 - n) * (11 - n) * base}rem`;
        playBeat();
        if (n <= 1) {
          clearInterval(timer);
          setTimeout(() => {
            preCountdown.classList.add('hidden');
            video.muted = false;
            video.volume = 1.0;
            video.play();
          }, 500);
        }
      }, 1000);
    };
    preCountdown.addEventListener('click', start);
  } else if (video) {
    video.muted = false;
    video.volume = 1.0;
    const autoplay = video.play();
    if (autoplay !== undefined) {
      autoplay.catch(() => {
        const resume = () => {
          video.play();
          document.removeEventListener('click', resume);
        };
        document.addEventListener('click', resume, { once: true });
      });
    }
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
    window.addEventListener('load', adjustCardSize);
    document.fonts?.ready.then(adjustCardSize);

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
