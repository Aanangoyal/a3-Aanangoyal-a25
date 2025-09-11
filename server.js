// Derived verdict
function computeVerdict(rating) {
    if (rating >= 8) return "Must Watch";
    if (rating >= 5) return "Decent";
    return "Skip";
  }
  
  // Example when adding a movie
  app.post('/api/add', (req, res) => {
    const { id, title, genre, rating, dateWatched } = req.body;
    const verdict = computeVerdict(rating);
  
    // Replace if exists
    dataset = dataset.filter(item => item.id !== id);
  
    dataset.push({ id, title, genre, rating, dateWatched, verdict });
    res.json(dataset);
  });
  