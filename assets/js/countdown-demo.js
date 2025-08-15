document.addEventListener('DOMContentLoaded', () => {
  const el = document.getElementById('countdownDemo');
  if (!el) return;
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
  const sizeFor = (val) => `${(11 - val) * (11 - val) * 0.5}rem`;

  el.textContent = n;
  el.style.fontFamily = 'var(--font-heading)';
  el.style.fontSize = sizeFor(n);
  playBeat();

  // Enable transition after the initial size is applied so 10 doesn't animate
  requestAnimationFrame(() => {
    el.style.transition = 'font-size 0.7s var(--ease-med)';
  });

  const timer = setInterval(() => {
    n--;
    el.textContent = n;
    el.style.fontSize = sizeFor(n);
    playBeat();
    if (n === 1) {
      clearInterval(timer);
    }
  }, 1000);
});
