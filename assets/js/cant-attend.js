document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('cantAttendForm');
  const msg = document.getElementById('formMessage');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const nameEl = document.getElementById('nameInput');
      const name = nameEl.value.trim();
      if (!name) return;
      const list = JSON.parse(localStorage.getItem('cantAttendList') || '[]');
      list.push({ name, timestamp: new Date().toISOString() });
      localStorage.setItem('cantAttendList', JSON.stringify(list));
      if (msg) msg.textContent = 'Thank you! Your response has been saved locally.';
      form.reset();
    });
  }

  const listContainer = document.getElementById('submissionList');
  if (listContainer) {
    const list = JSON.parse(localStorage.getItem('cantAttendList') || '[]');
    if (list.length === 0) {
      listContainer.innerHTML = '<li>No submissions yet.</li>';
    } else {
      list.forEach(item => {
        const li = document.createElement('li');
        const date = new Date(item.timestamp);
        li.textContent = `${item.name} - ${date.toLocaleDateString()}`;
        listContainer.appendChild(li);
      });
    }
  }
});
