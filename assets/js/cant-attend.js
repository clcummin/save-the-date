document.addEventListener('DOMContentLoaded', () => {
  const trigger = document.getElementById('showCantAttendForm');
  const backContent = document.getElementById('backContent');
  const formContainer = document.getElementById('cantAttendFormContainer');
  const form = formContainer ? formContainer.querySelector('form') : null;

  if (trigger && backContent && formContainer) {
    trigger.addEventListener('click', () => {
      backContent.style.display = 'none';
      formContainer.style.display = 'block';
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      try {
        await fetch(form.action, { method: 'POST', body: formData, mode: 'no-cors' });
        window.location.href = 'thankyou.html';
      } catch (err) {
        formContainer.innerHTML = '<p class="thank-you-message">Submission failed. Please try again later.</p>';
      }
    });
  }
});
