const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory dataset
let dataset = [];

// Derived verdict function
function computeVerdict(rating) {
  if (rating >= 8) return "Must Watch";
  if (rating >= 5) return "Decent";
  return "Skip";
}

// Get all data
app.get('/api/data', (req, res) => {
  res.json(dataset);
});

// Add or update a movie
app.post('/api/add', (req, res) => {
  let { id, title, genre, rating, dateWatched } = req.body;

  if (!title || !genre || !rating || !dateWatched) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  rating = parseInt(rating);
  const verdict = computeVerdict(rating);

  // If ID not provided, auto-generate one
  if (!id || id === "") {
    id = String(Date.now());
  }

  // Remove existing if updating
  dataset = dataset.filter(item => item.id !== id);

  dataset.push({ id, title, genre, rating, dateWatched, verdict });
  res.json(dataset);
});

// Delete movie
app.post('/api/delete', (req, res) => {
  const { id } = req.body;
  dataset = dataset.filter(item => item.id !== id);
  res.json(dataset);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
