document.addEventListener('DOMContentLoaded', () => {
  const trigger = document.getElementById('showCantAttendForm');
  const container = document.querySelector('.attendance-form-container');
  const closeBtn = document.getElementById('closeCantAttendForm');

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
});
