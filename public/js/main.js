// script.js

const assignmentTableBody = document.querySelector('#assignmentTable tbody');
const assignmentForm = document.getElementById('assignmentForm');
const deleteForm = document.getElementById('deleteForm');

const idInput = document.getElementById('id');
const subjectInput = document.getElementById('subject');
const hoursInput = document.getElementById('hours');
const dueDateInput = document.getElementById('dueDate');
const deleteIdInput = document.getElementById('deleteId');

async function getData() {
  const res = await fetch('/data');
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}

function stressClass(value) {
  if (value <= 3) return 'stress-low';
  if (value <= 6) return 'stress-med';
  return 'stress-high';
}

function formatDate(dStr) {
  try {
    const d = new Date(dStr);
    return d.toLocaleDateString();
  } catch {
    return dStr;
  }
}

function renderTable(rows) {
  assignmentTableBody.innerHTML = '';
  if (!rows.length) {
    const r = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    td.textContent = 'No assignments yet. Add one using the form.';
    td.style.padding = '14px';
    r.appendChild(td);
    assignmentTableBody.appendChild(r);
    return;
  }
  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.id}</td>
      <td>${r.subject}</td>
      <td>${r.hours}</td>
      <td>${formatDate(r.dueDate)}</td>
      <td class="${stressClass(r.stress)}">${r.stress}</td>
    `;
    // click to load into form for editing
    tr.addEventListener('click', () => {
      idInput.value = r.id;
      subjectInput.value = r.subject;
      hoursInput.value = r.hours;
      dueDateInput.value = r.dueDate;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    assignmentTableBody.appendChild(tr);
  });
}

async function refresh() {
  const data = await getData();
  renderTable(data);
}

assignmentForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    id: idInput.value.trim() || undefined, // undefined -> server will create id
    subject: subjectInput.value.trim(),
    hours: Number(hoursInput.value),
    dueDate: dueDateInput.value
  };
  // simple validation client-side
  if (!payload.subject || !payload.dueDate || isNaN(payload.hours)) {
    alert('Please fill subject, hours, and due date.');
    return;
  }
  const res = await fetch('/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    alert('Server error saving assignment.');
    return;
  }
  const json = await res.json();
  renderTable(json.data || []);
  // clear id (so next create is new) but keep others
  idInput.value = '';
});

document.getElementById('clearBtn').addEventListener('click', () => {
  idInput.value = '';
  subjectInput.value = '';
  hoursInput.value = '';
  dueDateInput.value = '';
});

deleteForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = deleteIdInput.value.trim();
  if (!id) { alert('Enter an ID to delete'); return; }
  if (!confirm('Delete assignment with ID ' + id + '?')) return;
  const res = await fetch('/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
  if (!res.ok) {
    alert('Server error deleting.');
    return;
  }
  const json = await res.json();
  renderTable(json.data || []);
  deleteIdInput.value = '';
});

// initial load
refresh();
