document.addEventListener('DOMContentLoaded', () => {
  document.documentElement.classList.add('js');

  const layout = document.getElementById('countdownLayout');
  const square = document.getElementById('countdownSquare');
  const numberEl = document.getElementById('countdownDemo');
  const startOverlay = document.getElementById('preCountdown');
  if (!layout || !square || !numberEl || !startOverlay) {
    return;
  }

  const videoWrapper = square.querySelector('.countdown-video');
  const video = videoWrapper?.querySelector('video') || null;
  let hasStarted = false;

  const countdownImageSources = [
    'assets/images/AUG4710_bw.jpg',
    'assets/images/AUG4726_bw.jpg',
    'assets/images/AUG4738_bw.jpg',
    'assets/images/AUG4759_bw.jpg',
    'assets/images/AUG4761_bw.jpg',
    'assets/images/AUG4849_bw.jpg',
    'assets/images/AUG4869_bw.jpg',
    'assets/images/AUG5106_bw.jpg',
    'assets/images/AUG5127_bw.jpg',
    'assets/images/AUG5139_bw.jpg',
    'assets/images/AUG5177_bw.jpg',
    'assets/images/AUG5181_bw.jpg',
    'assets/images/AUG5201_bw.jpg',
    'assets/images/AUG5253_bw.jpg',
    'assets/images/AUG5290_bw.jpg',
    'assets/images/AUG5306_bw.jpg'
  ];

  const squareLayout = [
    { row: 1, col: 1 },
    { row: 1, col: 2 },
    { row: 1, col: 3 },
    { row: 1, col: 4 },
    { row: 1, col: 5 },
    { row: 2, col: 5 },
    { row: 3, col: 5 },
    { row: 4, col: 5 },
    { row: 5, col: 5 },
    { row: 5, col: 4 },
    { row: 5, col: 3 },
    { row: 5, col: 2 },
    { row: 5, col: 1 },
    { row: 4, col: 1 },
    { row: 3, col: 1 },
    { row: 2, col: 1 }
  ];

  const randomBetween = (min, max) => Math.random() * (max - min) + min;

  const imageElements = [];
  const fragment = document.createDocumentFragment();
  const framesToUse = countdownImageSources.slice(0, squareLayout.length);
  framesToUse.forEach((src, index) => {
    const frame = document.createElement('figure');
    frame.className = 'countdown-image';
    frame.style.gridRow = String(squareLayout[index]?.row ?? 'auto');
    frame.style.gridColumn = String(squareLayout[index]?.col ?? 'auto');
    const tilt = randomBetween(-6, 6);
    frame.style.setProperty('--tilt-start', `${tilt.toFixed(2)}deg`);
    frame.style.setProperty('--tilt-mid', `${(tilt * 0.4).toFixed(2)}deg`);

    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    img.decoding = 'async';
    img.loading = 'eager';
    img.setAttribute('draggable', 'false');
    frame.appendChild(img);

    fragment.appendChild(frame);
    imageElements.push(frame);
  });

  layout.insertBefore(fragment, square);

  requestAnimationFrame(() => {
    layout.classList.add('is-active');
  });

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
    gain.gain.linearRampToValueAtTime(1.1, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    osc.start(now);
    osc.stop(now + 0.32);
  };

  const measureSquare = () => {
    const rect = square.getBoundingClientRect();
    if (rect.width && rect.height) {
      return Math.min(rect.width, rect.height);
    }
    return Math.min(window.innerWidth, window.innerHeight) * 0.55;
  };

  const sizeFor = (val) => {
    const base = measureSquare();
    const minSize = base * 0.34;
    const maxSize = base * 0.74;
    const progress = Math.max(0, Math.min(1, (11 - val) / 11));
    const eased = progress * progress;
    const next = minSize + (maxSize - minSize) * eased;
    return `${Math.max(minSize, Math.min(next, maxSize))}px`;
  };

  const totalImages = imageElements.length;
  let currentImage = -1;
  const baseDuration = 0.78;
  const minDuration = 0.28;
  const durationStep = totalImages > 1 ? (baseDuration - minDuration) / (totalImages - 1) : 0;

  const revealNextImages = (count = 1) => {
    for (let i = 0; i < count; i += 1) {
      if (currentImage >= totalImages - 1) return;
      const nextIndex = currentImage + 1;
      const frame = imageElements[nextIndex];
      if (!frame) return;
      const duration = Math.max(minDuration, baseDuration - durationStep * nextIndex);
      frame.style.setProperty('--hit-duration', `${duration.toFixed(2)}s`);
      requestAnimationFrame(() => {
        frame.classList.add('active');
      });
      currentImage = nextIndex;
    }
  };

  const revealForNumber = (value) => {
    const remainingImages = totalImages - (currentImage + 1);
    if (remainingImages <= 0) return;
    const remainingSteps = Math.max(1, value + 1);
    const toReveal = Math.max(1, Math.ceil(remainingImages / remainingSteps));
    revealNextImages(toReveal);
  };

  const updateNumber = (value) => {
    const clamped = Math.max(0, value);
    numberEl.classList.remove('is-visible');
    void numberEl.offsetWidth;
    numberEl.textContent = clamped;
    numberEl.style.fontSize = sizeFor(clamped);
    numberEl.classList.add('is-visible');
  };

  let countdownTimer = () => {};
  let countdownResolved = false;
  const countdownComplete = new Promise((resolve) => {
    const finish = () => {
      if (countdownResolved) return;
      countdownResolved = true;
      resolve();
    };
    countdownTimer = finish;
  });

  const waitForVideo = new Promise((resolve) => {
    if (!video) {
      resolve();
      return;
    }
    if (video.readyState >= 2) {
      resolve();
    } else {
      const onReady = () => {
        video.removeEventListener('canplay', onReady);
        video.removeEventListener('loadeddata', onReady);
        resolve();
      };
      video.addEventListener('canplay', onReady);
      video.addEventListener('loadeddata', onReady);
    }
  });

  let intervalId = null;

  const finishCountdown = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    countdownTimer();
  };

  const startCountdown = () => {
    if (hasStarted) return;
    hasStarted = true;
    startOverlay.classList.remove('start-prompt');
    startOverlay.classList.add('is-counting');
    startOverlay.setAttribute('aria-hidden', 'true');
    startOverlay.setAttribute('tabindex', '-1');
    startOverlay.blur();

    requestAnimationFrame(() => {
      startOverlay.classList.add('hidden');
      startOverlay.textContent = '';
    });

    audioCtx.resume().catch(() => {});

    if (video) {
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
    }

    let n = 10;
    numberEl.style.transition = 'opacity 0.45s ease, transform 0.7s var(--ease-med), font-size 0.7s var(--ease-med)';
    updateNumber(n);
    revealForNumber(n);
    playBeat();

    intervalId = setInterval(() => {
      n -= 1;
      if (n < 0) n = 0;
      updateNumber(n);
      playBeat();

      revealForNumber(n);

      if (n <= 1) {
        clearInterval(intervalId);
        setTimeout(() => {
          revealForNumber(0);
          finishCountdown();
        }, 650);
      }
    }, 1000);
  };

  startOverlay.addEventListener('click', startCountdown);
  startOverlay.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      startCountdown();
    }
  });
  startOverlay.setAttribute('tabindex', '0');
  startOverlay.setAttribute('role', 'button');
  startOverlay.setAttribute('aria-label', 'Start countdown');

  Promise.all([countdownComplete, waitForVideo]).then(() => {
    square.classList.add('show-video');
    if (video) {
      video.muted = false;
      video.currentTime = 0;
      const playback = video.play();
      if (playback) {
        playback.catch(() => {});
      }
    }
    document.body.classList.remove('no-scroll');
  });
});
