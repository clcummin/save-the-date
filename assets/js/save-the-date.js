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
});
