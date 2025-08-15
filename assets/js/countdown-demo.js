document.addEventListener('DOMContentLoaded', () => {
  const el = document.getElementById('countdownDemo');
  if (!el) return;
  let n = 10;
  let timer;
  const render = () => {
    el.textContent = n;
    el.style.fontFamily = 'var(--font-heading)';
    el.style.transition = 'font-size 0.7s var(--ease-med)';
    el.style.fontSize = `${(11 - n) * (11 - n) * 0.5}rem`;
    if (n === 1) {
      clearInterval(timer);
    } else {
      n--;
    }
  };
  render();
  timer = setInterval(render, 1000);
});
