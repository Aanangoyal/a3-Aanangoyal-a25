const express = require('express');
const path = require('path');
const app = express();

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let movies = [
    {
        id: 1,
        title: "The Shawshank Redemption",
        genre: "Drama",
        rating: 9.5,
        dateAdded: "2024-01-15",
        recommendation: "Must Watch" 
    },
    {
        id: 2,
        title: "Pulp Fiction",
        genre: "Crime",
        rating: 8.8,
        dateAdded: "2024-02-20",
        recommendation: "Highly Recommended" 
    }
];

let nextId = 3;

function calculateRecommendation(rating) {
    if (rating >= 9.0) {
        return "Must Watch";
    } else if (rating >= 7.5) {
        return "Highly Recommended";
    } else if (rating >= 6.0) {
        return "Worth Watching";
    } else {
        return "Skip";
    }
}

app.get('/api/movies', (req, res) => {
    res.json(movies);
});

app.post('/api/movies', (req, res) => {
    const { title, genre, rating, dateAdded } = req.body;
    const newMovie = {
        id: nextId++,
        title,
        genre,
        rating: parseFloat(rating),
        dateAdded,
        recommendation: calculateRecommendation(parseFloat(rating))
    };
    movies.push(newMovie);
    res.json(newMovie);
});

app.put('/api/movies/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { title, genre, rating, dateAdded } = req.body;
    const movie = movies.find(m => m.id === id);

    if (movie) {
        movie.title = title || movie.title;
        movie.genre = genre || movie.genre;
        movie.rating = rating !== undefined ? parseFloat(rating) : movie.rating;
        movie.dateAdded = dateAdded || movie.dateAdded;
        movie.recommendation = calculateRecommendation(movie.rating);
        res.json(movie);
    } else {
        res.status(404).json({ message: "Movie not found" });
    }
});

app.patch('/api/movies/:id/rating', (req, res) => {
    const id = parseInt(req.params.id);
    const { rating } = req.body;
    const movie = movies.find(m => m.id === id);

    if (movie) {
        movie.rating = parseFloat(rating);
        movie.recommendation = calculateRecommendation(movie.rating);
        res.json(movie);
    } else {
        res.status(404).json({ message: "Movie not found" });
    }
});

app.delete('/api/movies/:id', (req, res) => {
    const id = parseInt(req.params.id);
    movies = movies.filter(m => m.id !== id);
    res.json({ message: "Movie deleted" });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/results', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'results.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
