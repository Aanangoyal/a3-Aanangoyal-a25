const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory data storage
let movies = [
    {
        id: 1,
        title: "The Matrix",
        rating: 9,
        year: 1999,
        category: "Excellent" // This is the derived field
    },
    {
        id: 2,
        title: "Avatar",
        rating: 7,
        year: 2009,
        category: "Good"
    }
];

let nextId = 3;

// Function to calculate derived field (category based on rating)
function calculateCategory(rating) {
    if (rating >= 9) return "Excellent";
    if (rating >= 7) return "Good";
    if (rating >= 5) return "Average";
    return "Poor";
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/results', (req, res) => {
    res.sendFile(__dirname + '/public/results.html');
});

// API endpoints
app.get('/api/movies', (req, res) => {
    res.json(movies);
});

app.post('/api/movies', (req, res) => {
    const { title, rating, year } = req.body;
    
    const newMovie = {
        id: nextId++,
        title: title,
        rating: parseInt(rating),
        year: parseInt(year),
        category: calculateCategory(parseInt(rating)) // Derived field
    };
    
    movies.push(newMovie);
    res.json(newMovie);
});

app.delete('/api/movies/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = movies.findIndex(movie => movie.id === id);
    
    if (index !== -1) {
        movies.splice(index, 1);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Movie not found' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});