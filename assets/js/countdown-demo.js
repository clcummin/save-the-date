document.addEventListener('DOMContentLoaded', () => {
  document.documentElement.classList.add('js');

  const el = document.getElementById('countdownDemo');
  if (!el) return;

  const stage = document.querySelector('.countdown-stage');
  const shell = document.querySelector('.countdown-shell');
  const video = shell?.querySelector('video');

  const countdownImageData = [
    { src: 'assets/images/AUG4710_bw.jpg', x: 10, y: 10, tiltStart: '-6deg', tiltMid: '-2deg' },
    { src: 'assets/images/AUG4726_bw.jpg', x: 30, y: 8, tiltStart: '5deg', tiltMid: '1deg' },
    { src: 'assets/images/AUG4738_bw.jpg', x: 50, y: 6, tiltStart: '-4deg', tiltMid: '-1deg' },
    { src: 'assets/images/AUG4759_bw.jpg', x: 70, y: 8, tiltStart: '3deg', tiltMid: '1deg' },
    { src: 'assets/images/AUG4761_bw.jpg', x: 90, y: 10, tiltStart: '-5deg', tiltMid: '-2deg' },
    { src: 'assets/images/AUG4849_bw.jpg', x: 92, y: 35, tiltStart: '6deg', tiltMid: '2deg' },
    { src: 'assets/images/AUG4869_bw.jpg', x: 88, y: 88, tiltStart: '-3deg', tiltMid: '-1deg' },
    { src: 'assets/images/AUG5106_bw.jpg', x: 50, y: 92, tiltStart: '4deg', tiltMid: '1deg' },
    { src: 'assets/images/AUG5127_bw.jpg', x: 10, y: 90, tiltStart: '-6deg', tiltMid: '-2deg' },
    { src: 'assets/images/AUG5139_bw.jpg', x: 8, y: 50, tiltStart: '5deg', tiltMid: '1deg' }
  ];

  const imageStack = stage ? document.createElement('div') : null;
  let imageElements = [];
  if (imageStack && countdownImageData.length) {
    imageStack.className = 'countdown-image-stack';
    imageStack.setAttribute('aria-hidden', 'true');

    const sequence = countdownImageData.slice(0, 10);
    imageElements = sequence.map((data) => {
      const wrapper = document.createElement('figure');
      wrapper.className = 'countdown-image';
      if (typeof data.x === 'number') wrapper.style.setProperty('--pos-x', `${data.x}`);
      if (typeof data.y === 'number') wrapper.style.setProperty('--pos-y', `${data.y}`);
      if (data.tiltStart) wrapper.style.setProperty('--tilt-start', data.tiltStart);
      if (data.tiltMid) wrapper.style.setProperty('--tilt-mid', data.tiltMid);

      const img = document.createElement('img');
      img.src = data.src;
      img.alt = '';
      img.decoding = 'async';
      img.loading = 'eager';
      img.setAttribute('draggable', 'false');
      wrapper.appendChild(img);
      imageStack.appendChild(wrapper);
      return wrapper;
    });

    if (stage && shell && shell.parentNode === stage) {
      stage.insertBefore(imageStack, shell);
    } else if (stage) {
      stage.appendChild(imageStack);
    }

    requestAnimationFrame(() => {
      imageStack.classList.add('is-active');
    });
  }

  let n = 10;
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
    gain.gain.linearRampToValueAtTime(1, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.start(now);
    osc.stop(now + 0.3);
  };

  const containerRect = shell?.getBoundingClientRect();
  const fallbackMeasure = Math.min(window.innerWidth, window.innerHeight) * 0.5;
  const minSize = containerRect ? Math.min(containerRect.width, containerRect.height) * 0.32 : fallbackMeasure * 0.6;
  const maxSize = containerRect ? Math.min(containerRect.width, containerRect.height) * 0.72 : fallbackMeasure;
  const sizeFor = (val) => {
    const progress = (10 - val) / 9;
    const nextSize = minSize + (maxSize - minSize) * Math.max(0, Math.min(1, progress));
    return `${Math.max(48, Math.min(nextSize, maxSize))}px`;
  };

  el.textContent = n;
  el.style.fontFamily = 'var(--font-heading)';
  el.style.fontSize = sizeFor(n);

  const totalImages = imageElements.length;
  let currentImage = -1;
  const baseDuration = 0.72;
  const minDuration = 0.32;
  const durationStep = totalImages > 1 ? (baseDuration - minDuration) / (totalImages - 1) : 0;

  const showNextImage = () => {
    if (!imageElements.length) return;
    const nextIndex = Math.min(currentImage + 1, imageElements.length - 1);
    if (nextIndex === currentImage) return;
    const nextEl = imageElements[nextIndex];
    const duration = Math.max(minDuration, baseDuration - durationStep * nextIndex);
    nextEl.style.setProperty('--hit-duration', `${duration}s`);
    nextEl.classList.add('active');
    currentImage = nextIndex;
  };

  showNextImage();
  playBeat();

  let countdownResolved = false;
  let resolveCountdown;
  const countdownComplete = new Promise((resolve) => {
    resolveCountdown = () => {
      if (countdownResolved) return;
      countdownResolved = true;
      resolve();
    };
  });

  const videoReady = new Promise((resolve) => {
    if (!video) {
      resolve();
      return;
    }
    if (video.readyState >= 2) {
      resolve();
    } else {
      const onCanPlay = () => {
        video.removeEventListener('canplay', onCanPlay);
        video.removeEventListener('loadeddata', onCanPlay);
        resolve();
      };
      video.addEventListener('canplay', onCanPlay);
      video.addEventListener('loadeddata', onCanPlay);
    }
  });

  // Enable transition after the initial size is applied so 10 doesn't animate
  requestAnimationFrame(() => {
    el.style.transition = 'opacity 0.6s ease, font-size 0.7s var(--ease-med)';
    el.style.fontSize = sizeFor(n);
  });

  const timer = setInterval(() => {
    n--;
    if (n < 1) {
      clearInterval(timer);
      resolveCountdown();
      return;
    }
    el.textContent = n;
    el.style.fontSize = sizeFor(n);
    playBeat();
    showNextImage();
    if (n === 1) {
      clearInterval(timer);
      setTimeout(resolveCountdown, 650);
    }
  }, 1000);

  Promise.all([countdownComplete, videoReady]).then(() => {
    el.style.opacity = '0';
    if (shell) {
      shell.classList.add('show-video');
    }
    if (imageStack) {
      imageStack.classList.add('fade-out');
      imageStack.addEventListener('transitionend', (event) => {
        if (event.target === imageStack) {
          imageStack.remove();
        }
      }, { once: true });
    }
    if (video) {
      if (video.paused && typeof video.play === 'function') {
        video.play().catch(() => {});
      }
    }
    document.body.classList.remove('no-scroll');
  });
});
