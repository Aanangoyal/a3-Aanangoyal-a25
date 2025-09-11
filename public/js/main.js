async function fetchData() {
  const response = await fetch('/api/data');
  const data = await response.json();

  const tbody = document.querySelector('#ratingsTable tbody');
  tbody.innerHTML = '';

  data.forEach(row => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>${row.id}</td>
      <td>${row.title}</td>
      <td>${row.genre}</td>
      <td>${row.rating}</td>
      <td>${row.dateWatched}</td>
      <td class="${getVerdictClass(row.verdict)}">${row.verdict}</td>
    `;

    // Click row to load data into form for editing
    tr.addEventListener('click', () => {
      document.getElementById('id').value = row.id;
      document.getElementById('title').value = row.title;
      document.getElementById('genre').value = row.genre;
      document.getElementById('rating').value = row.rating;
      document.getElementById('dateWatched').value = row.dateWatched;
    });

    tbody.appendChild(tr);
  });
}

function getVerdictClass(verdict) {
  if (verdict === 'Must Watch') return 'verdict-good';
  if (verdict === 'Decent') return 'verdict-okay';
  return 'verdict-bad';
}

// Handle add/update
document.getElementById('ratingForm').addEventListener('submit', async e => {
  e.preventDefault();

  const payload = {
    id: document.getElementById('id').value,
    title: document.getElementById('title').value,
    genre: document.getElementById('genre').value,
    rating: parseInt(document.getElementById('rating').value),
    dateWatched: document.getElementById('dateWatched').value,
  };

  await fetch('/api/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  fetchData();
});

// Handle delete
document.getElementById('deleteForm').addEventListener('submit', async e => {
  e.preventDefault();

  const id = document.getElementById('deleteId').value;

  await fetch('/api/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });

  fetchData();
});

// Initial load
fetchData();
