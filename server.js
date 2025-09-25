require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

let db;
const client = new MongoClient(process.env.MONGODB_URI);

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, 
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true
    }
}));

// Connect to MongoDB
async function connectDB() {
    try {
        await client.connect();
        db = client.db('movietracker');
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        setTimeout(connectDB, 5000);
    }
}

function calculateRecommendation(rating) {
    if (rating >= 9.0) return "Must Watch";
    if (rating >= 7.5) return "Highly Recommended";
    if (rating >= 6.0) return "Worth Watching";
    return "Skip";
}

// Routes - NO MIDDLEWARE ON THESE
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// PROTECTED ROUTES - Check auth individually
app.get('/', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/results', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'public', 'results.html'));
});

// API Routes
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    try {
        let user = await db.collection('users').findOne({ username });
        
        if (!user) {
            const hashedPassword = await bcrypt.hash(password, 10);
            user = {
                username,
                password: hashedPassword,
                movies: [],
                createdAt: new Date()
            };
            const result = await db.collection('users').insertOne(user);
            req.session.userId = result.insertedId;
            req.session.username = username;
            return res.json({ message: 'Account created successfully!' });
        }
        
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid password' });
        }
        
        req.session.userId = user._id;
        req.session.username = username;
        res.json({ message: 'Login successful' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        res.json({ message: 'Logged out successfully' });
    });
});

app.get('/api/movies', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    db.collection('users').findOne({ username: req.session.username })
        .then(user => res.json(user?.movies || []))
        .catch(error => res.status(500).json({ error: 'Failed to fetch movies' }));
});

app.post('/api/movies', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const { title, genre, rating } = req.body;
    
    if (!title || !genre || rating === undefined) {
        return res.status(400).json({ error: 'All fields required' });
    }

    const newMovie = {
        id: Date.now() + Math.random(),
        title,
        genre,
        rating: parseFloat(rating),
        dateAdded: new Date().toISOString(),
        recommendation: calculateRecommendation(parseFloat(rating))
    };

    db.collection('users').updateOne(
        { username: req.session.username },
        { $push: { movies: newMovie } }
    )
    .then(() => res.json(newMovie))
    .catch(error => res.status(500).json({ error: 'Failed to add movie' }));
});

app.patch('/api/movies/:id/rating', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const movieId = parseFloat(req.params.id);
    const { rating } = req.body;
    const newRating = parseFloat(rating);
    const newRecommendation = calculateRecommendation(newRating);
    
    db.collection('users').updateOne(
        { username: req.session.username, "movies.id": movieId },
        { $set: { "movies.$.rating": newRating, "movies.$.recommendation": newRecommendation } }
    )
    .then(() => res.json({ message: 'Rating updated' }))
    .catch(error => res.status(500).json({ error: 'Failed to update rating' }));
});

app.delete('/api/movies/:id', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const movieId = parseFloat(req.params.id);

    db.collection('users').updateOne(
        { username: req.session.username },
        { $pull: { movies: { id: movieId } } }
    )
    .then(() => res.json({ message: 'Movie deleted' }))
    .catch(error => res.status(500).json({ error: 'Failed to delete movie' }));
});

// Start server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});

process.on('SIGINT', async () => {
    await client.close();
    process.exit(0);
});