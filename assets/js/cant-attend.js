document.addEventListener('DOMContentLoaded', () => {
  const trigger = document.getElementById('showCantAttendForm');
  const container = document.querySelector('.attendance-form-container');

  if (trigger && container) {
    trigger.addEventListener('click', () => {
      container.style.display = 'block';
    });
  }
});
