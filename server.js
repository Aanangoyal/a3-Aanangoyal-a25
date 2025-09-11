const express = require('express');
const path = require('path');
const app = express();

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory database (tabular dataset with 3+ fields)
let movies = [
    {
        id: 1,
        title: "The Shawshank Redemption",
        genre: "Drama",
        rating: 9.5,
        dateAdded: "2024-01-15",
        recommendation: "Must Watch" // Derived field
    },
    {
        id: 2,
        title: "Pulp Fiction",
        genre: "Crime",
        rating: 8.8,
        dateAdded: "2024-02-20",
        recommendation: "Highly Recommended" // Derived field
    }
];

let nextId = 3;

// Server Logic: Function to compute derived field
function calculateRecommendation(rating) {
    if (rating >= 9.0) {
        return "Must Watch";
    } else if (rating >= 7.5) {
        return "Highly Recommended";
    } else if (rating >= 6.0) {
        return "Worth Watching";
    } else if (rating >= 4.0) {
        return "Mediocre";
    } else {
        return "Skip";
    }
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/results', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'results.html'));
});

// API endpoint to get all movies (Results functionality)
app.get('/api/movies', (req, res) => {
    res.json(movies);
});

// API endpoint to add a new movie (Form/Entry functionality)
app.post('/api/movies', (req, res) => {
    const { title, genre, rating } = req.body;
    
    if (!title || !genre || !rating) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const numericRating = parseFloat(rating);
    if (isNaN(numericRating) || numericRating < 0 || numericRating > 10) {
        return res.status(400).json({ error: 'Rating must be a number between 0 and 10' });
    }

    // Create new movie with derived field
    const newMovie = {
        id: nextId++,
        title: title.trim(),
        genre: genre.trim(),
        rating: numericRating,
        dateAdded: new Date().toISOString().split('T')[0],
        recommendation: calculateRecommendation(numericRating) // Derived field computation
    };

    movies.push(newMovie);
    res.json(newMovie);
});

// API endpoint to delete a movie (Form/Entry functionality)
app.delete('/api/movies/:id', (req, res) => {
    const movieId = parseInt(req.params.id);
    const movieIndex = movies.findIndex(movie => movie.id === movieId);
    
    if (movieIndex === -1) {
        return res.status(404).json({ error: 'Movie not found' });
    }

    const deletedMovie = movies.splice(movieIndex, 1)[0];
    res.json(deletedMovie);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});