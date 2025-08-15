document.addEventListener('DOMContentLoaded', () => {
  const el = document.getElementById('countdownDemo');
  if (!el) return;
  let n = 10;
  let timer;
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
  const render = () => {
    el.textContent = n;
    el.style.fontFamily = 'var(--font-heading)';
    el.style.transition = 'font-size 0.7s var(--ease-med)';
    el.style.fontSize = `${(11 - n) * (11 - n) * 0.5}rem`;
    playBeat();
    if (n === 1) {
      clearInterval(timer);
    } else {
      n--;
    }
  };
  render();
  timer = setInterval(render, 1000);
});
