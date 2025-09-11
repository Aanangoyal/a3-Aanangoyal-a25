// server.js
const http = require('http');
const fs = require('fs');
const path = require('path');

const PUBLIC = path.join(__dirname, 'public'); // adjust if your files are elsewhere
const PORT = process.env.PORT || 3000;

// in-memory dataset (sample initial rows)
let dataset = [
  { id: '1', subject: 'Math HW', hours: 3, dueDate: '2025-09-12', stress: 2 },
  { id: '2', subject: 'CS Lab', hours: 6, dueDate: '2025-09-10', stress: 5 }
];

// Simple helper to compute 'stress' derived field:
// rule: stress = Math.round(hours * urgencyFactor)
// urgencyFactor = (daysTillDue <= 0 ? 2.5 : 1 + (7 - daysTillDue)/7) clamped
function computeStress(hours, dueDateStr) {
  const now = new Date();
  const due = new Date(dueDateStr);
  const msPerDay = 24 * 3600 * 1000;
  const days = Math.ceil((due - now) / msPerDay);
  // urgency factor grows as due date approaches
  let urgency = 1.0;
  if (days <= 0) urgency = 2.5;
  else urgency = 1 + Math.max(0, (7 - days)) / 7; // between 1 and 2
  const raw = Number(hours) * urgency;
  // clamp to 1..10
  let stress = Math.round(raw);
  if (stress < 1) stress = 1;
  if (stress > 10) stress = 10;
  return stress;
}

// Serve static files helper
function serveStatic(req, res) {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(PUBLIC, decodeURI(reqPath));
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain');
      res.end('404 Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const mime = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml'
    }[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', mime);
    fs.createReadStream(filePath).pipe(res);
  });
}

function parseJSONBody(req, callback) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    try { callback(null, JSON.parse(body || '{}')); }
    catch (e) { callback(e); }
  });
}

const server = http.createServer((req, res) => {
  const { method, url } = req;

  // API: get data
  if (url === '/data' && method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ data: dataset }));
    return;
  }

  // API: add or update (if id exists)
  if (url === '/add' && method === 'POST') {
    parseJSONBody(req, (err, body) => {
      if (err) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Bad JSON' }));
        return;
      }
      const { id, subject, hours, dueDate } = body;
      if (!subject || !dueDate || isNaN(Number(hours))) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Missing or invalid fields' }));
        return;
      }
      const newId = (id && String(id).trim()) ? String(id).trim() : String(Date.now());
      const stress = computeStress(Number(hours), dueDate);
      // if exists, update
      const idx = dataset.findIndex(r => r.id === newId);
      const row = { id: newId, subject: String(subject), hours: Number(hours), dueDate: String(dueDate), stress };
      if (idx >= 0) dataset[idx] = row;
      else dataset.push(row);

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ data: dataset }));
    });
    return;
  }

  // API: delete
  if (url === '/delete' && method === 'POST') {
    parseJSONBody(req, (err, body) => {
      if (err) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Bad JSON' }));
        return;
      }
      const { id } = body;
      if (!id) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Missing id' }));
        return;
      }
      const before = dataset.length;
      dataset = dataset.filter(r => r.id !== String(id));
      const removed = before - dataset.length;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ data: dataset, removed }));
    });
    return;
  }

  // Otherwise, serve static file
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
