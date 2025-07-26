document.addEventListener('DOMContentLoaded', () => {
  const trigger = document.getElementById('showCantAttendForm');
  const container = document.querySelector('.attendance-form-container');
  const closeBtn = document.getElementById('closeCantAttendForm');
  const form = container ? container.querySelector('form') : null;

  if (trigger && container) {
    trigger.addEventListener('click', () => {
      container.style.display = 'block';
    });
  }

  if (closeBtn && container) {
    closeBtn.addEventListener('click', () => {
      container.style.display = 'none';
    });
  }

  if (form && container) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      try {
        await fetch(form.action, { method: 'POST', body: formData, mode: 'no-cors' });
        container.innerHTML = '<p class="thank-you-message">Thank you for your submission!</p>';
        setTimeout(() => {
          container.style.display = 'none';
        }, 2000);
      } catch (err) {
        container.innerHTML = '<p class="thank-you-message">Submission failed. Please try again later.</p>';
        setTimeout(() => {
          container.style.display = 'none';
        }, 2000);
      }
    });
  }
});
