document.addEventListener('DOMContentLoaded', () => {
  const introCard = document.getElementById('introCard');
  const video = document.querySelector('.background-video video');
  const preCountdown = document.getElementById('preCountdown');
  const countdownImagesContainer = document.getElementById('countdownImages');
  const countdownImageSources = [
    'assets/images/AUG4670_bw.jpg',
    'assets/images/AUG4710_bw.jpg',
    'assets/images/AUG4726_bw.jpg',
    'assets/images/AUG4738_bw.jpg',
    'assets/images/AUG4759_bw.jpg',
    'assets/images/AUG5106_bw.jpg',
    'assets/images/AUG5127_bw.jpg',
    'assets/images/AUG5139_bw.jpg',
    'assets/images/AUG5177_bw.jpg',
    'assets/images/AUG5181_bw.jpg',
    'assets/images/AUG5201_bw.jpg',
    'assets/images/AUG5253_bw.jpg',
    'assets/images/AUG5279_bw.jpg',
    'assets/images/AUG5290_bw.jpg',
    'assets/images/AUG5306_bw.jpg',
    'assets/images/AUG5329_bw.jpg'
  ];
  const countdownFrames = [];
  const buildBorderLayout = (size) => {
    const positions = [];
    if (size < 2) return positions;

    for (let col = 1; col <= size; col += 1) {
      positions.push({ row: 1, col });
    }
    for (let row = 2; row <= size; row += 1) {
      positions.push({ row, col: size });
    }
    for (let col = size - 1; col >= 1; col -= 1) {
      positions.push({ row: size, col });
    }
    for (let row = size - 1; row >= 2; row -= 1) {
      positions.push({ row, col: 1 });
    }

    return positions;
  };

  const gridSize = 5;
  const squareLayout = buildBorderLayout(gridSize);
  const randomBetween = (min, max) => Math.random() * (max - min) + min;

  if (countdownImagesContainer) {
    countdownImagesContainer.classList.add('countdown-grid');
    const framesToUse = countdownImageSources.slice(0, squareLayout.length);
    framesToUse.forEach((src, index) => {
      const frame = document.createElement('div');
      frame.className = 'countdown-image';
      const layout = squareLayout[index];
      if (layout) {
        frame.style.gridRow = layout.row;
        frame.style.gridColumn = layout.col;
      }
      const tilt = randomBetween(-5, 5);
      frame.style.setProperty('--tilt-start', `${tilt.toFixed(2)}deg`);
      frame.style.setProperty('--tilt-mid', `${(tilt * 0.35).toFixed(2)}deg`);
      const img = document.createElement('img');
      img.src = src;
      img.alt = 'Lorraine and Christopher';
      img.loading = 'eager';
      img.decoding = 'async';
      frame.appendChild(img);
      countdownImagesContainer.appendChild(frame);
      countdownFrames.push(frame);
    });
  }
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

  const revealIntroCard = () => {
    if (!introCard) return;
    requestAnimationFrame(() => {
      introCard.classList.add('visible');
    });
  };

  if (video && introCard) {
    introCard.classList.remove('visible');
    const showAfterVideo = () => {
      revealIntroCard();
    };
    const fallbackDelay = Number.isFinite(video.duration) && video.duration > 0
      ? Math.ceil(video.duration * 1000) + 2000
      : 60000;
    const fallbackTimer = window.setTimeout(showAfterVideo, fallbackDelay);
    const handleAndClear = () => {
      window.clearTimeout(fallbackTimer);
      showAfterVideo();
    };
    ['ended', 'error', 'abort'].forEach((eventName) => {
      video.addEventListener(eventName, handleAndClear, { once: true });
    });
    if (video.ended) {
      handleAndClear();
    }
  } else if (introCard && !introCard.classList.contains('visible')) {
    revealIntroCard();
  }

  if (preCountdown && video) {
    preCountdown.textContent = 'Tap to Start';
    preCountdown.classList.add('start-prompt');
    const start = () => {
      audioCtx.resume();
      preCountdown.classList.remove('start-prompt');
      preCountdown.classList.add('is-counting');
      preCountdown.removeEventListener('click', start);

      if (countdownImagesContainer) {
        countdownImagesContainer.classList.remove('fade-out');
        countdownImagesContainer.classList.add('is-active');
      }

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

      let hitIndex = 0;
      const revealNextImage = (delay = 0) => {
        if (!countdownImagesContainer) return;
        if (hitIndex >= countdownFrames.length) return;
        const frame = countdownFrames[hitIndex];
        const progress = countdownFrames.length > 1 ? hitIndex / (countdownFrames.length - 1) : 1;
        const duration = Math.max(0.24, 0.88 - progress * 0.46);
        frame.style.setProperty('--hit-duration', `${duration.toFixed(2)}s`);
        const activate = () => frame.classList.add('active');
        if (delay) {
          setTimeout(() => requestAnimationFrame(activate), delay);
        } else {
          requestAnimationFrame(activate);
        }
        hitIndex += 1;
      };

      revealNextImage();

      // Enable transition after initial size is applied so first number doesn't animate
      requestAnimationFrame(() => {
        preCountdown.style.transition = 'font-size 0.7s var(--ease-med)';
      });

      const timer = setInterval(() => {
        n--;
        preCountdown.textContent = n;
        preCountdown.style.fontSize = `${(11 - n) * (11 - n) * base}rem`;
        playBeat();
        revealNextImage();
        if (n <= 4) {
          revealNextImage(240 - (n * 30));
        }
        if (n <= 2) {
          revealNextImage(160);
        }
        if (n <= 1) {
          clearInterval(timer);
          setTimeout(() => {
            preCountdown.classList.add('hidden');
            if (countdownImagesContainer) {
              countdownImagesContainer.classList.add('show-video');
            }
            video.muted = false;
            video.volume = 1.0;
            video.classList.add('is-visible');
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
      flipCard.style.width = '';
      flipCard.style.height = '';

      const stage = document.querySelector('.gallery-stage');
      const shell = introCard.querySelector('.intro-card-shell');
      const stageStyles = stage ? window.getComputedStyle(stage) : null;
      const shellStyles = shell ? window.getComputedStyle(shell) : null;
      const stagePaddingX = stageStyles ? parseFloat(stageStyles.paddingLeft) + parseFloat(stageStyles.paddingRight) : 0;
      const stagePaddingY = stageStyles ? parseFloat(stageStyles.paddingTop) + parseFloat(stageStyles.paddingBottom) : 0;
      const shellPaddingX = shellStyles ? parseFloat(shellStyles.paddingLeft) + parseFloat(shellStyles.paddingRight) : 0;
      const shellPaddingY = shellStyles ? parseFloat(shellStyles.paddingTop) + parseFloat(shellStyles.paddingBottom) : 0;

      const availableWidth = Math.max(window.innerWidth - stagePaddingX - shellPaddingX - buffer, 0);
      const availableHeight = Math.max(window.innerHeight - stagePaddingY - shellPaddingY - buffer, 0);
      const naturalWidth = Math.max(front.scrollWidth, back.scrollWidth) + buffer;
      const width = availableWidth ? Math.min(naturalWidth, availableWidth) : naturalWidth;
      flipCard.style.width = `${width}px`;

      requestAnimationFrame(() => {
        const recalculatedHeight = Math.max(front.scrollHeight, back.scrollHeight) + buffer;
        const height = availableHeight ? Math.min(recalculatedHeight, availableHeight) : recalculatedHeight;
        flipCard.style.height = `${height}px`;
      });
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
    const target = new Date('2026-09-12T00:00:00-07:00');
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
