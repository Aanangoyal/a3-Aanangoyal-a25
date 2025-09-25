require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB
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
        httpOnly: true,
        sameSite: 'lax'
    },
    name: 'movietracker.sid'
}));

// Debug middleware (remove after fixing)
app.use((req, res, next) => {
    console.log('Request:', {
        url: req.url,
        sessionId: req.sessionID,
        userId: req.session?.userId,
        method: req.method
    });
    next();
});

const requireAuth = (req, res, next) => {
    // Skip auth for login page and login API
    if (req.url === '/login' || req.url === '/api/login') {
        return next();
    }
    
    if (!req.session.userId) {
        console.log('No valid session, redirecting to login');
        return res.redirect('/login');
    }
    
    next();
};

async function connectDB() {
    try {
        await client.connect();
        db = client.db('movietracker');
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        console.log('Retrying connection in 5 seconds...');
        setTimeout(connectDB, 5000);
    }
}

function calculateRecommendation(rating) {
    if (rating >= 9.0) return "Must Watch";
    if (rating >= 7.5) return "Highly Recommended";
    if (rating >= 6.0) return "Worth Watching";
    return "Skip";
}

app.get('/', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/results', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'results.html'));
});

app.get('/login', (req, res) => {
    if (req.session.userId) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Auth endpoints
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
            await db.collection('users').insertOne(user);
            req.session.userId = user._id;
            req.session.username = username;
            console.log('New user created:', username);
            return res.json({ message: 'Account created successfully!' });
        }
        
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid password' });
        }
        
        req.session.userId = user._id;
        req.session.username = username;
        console.log('User logged in:', username);
        res.json({ message: 'Login successful' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/logout', (req, res) => {
    const username = req.session.username;
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ error: 'Logout failed' });
        }
        console.log('User logged out:', username);
        res.json({ message: 'Logged out successfully' });
    });
});

app.get('/api/movies', requireAuth, async (req, res) => {
    try {
        const user = await db.collection('users').findOne({ username: req.session.username });
        res.json(user?.movies || []);
    } catch (error) {
        console.error('Error fetching movies:', error);
        res.status(500).json({ error: 'Failed to fetch movies' });
    }
});

app.post('/api/movies', requireAuth, async (req, res) => {
    const { title, genre, rating } = req.body;
    
    if (!title || !genre || rating === undefined) {
        return res.status(400).json({ error: 'All fields required' });
    }

    try {
        const newMovie = {
            id: Date.now() + Math.random(),
            title,
            genre,
            rating: parseFloat(rating),
            dateAdded: new Date().toISOString(),
            recommendation: calculateRecommendation(parseFloat(rating))
        };

        await db.collection('users').updateOne(
            { username: req.session.username },
            { $push: { movies: newMovie } }
        );

        res.json(newMovie);
    } catch (error) {
        console.error('Error adding movie:', error);
        res.status(500).json({ error: 'Failed to add movie' });
    }
});

app.patch('/api/movies/:id/rating', requireAuth, async (req, res) => {
    const movieId = parseFloat(req.params.id);
    const { rating } = req.body;

    try {
        const newRating = parseFloat(rating);
        const newRecommendation = calculateRecommendation(newRating);
        
        await db.collection('users').updateOne(
            { username: req.session.username, "movies.id": movieId },
            { 
                $set: { 
                    "movies.$.rating": newRating,
                    "movies.$.recommendation": newRecommendation
                }
            }
        );

        res.json({ message: 'Rating updated' });
    } catch (error) {
        console.error('Error updating rating:', error);
        res.status(500).json({ error: 'Failed to update rating' });
    }
});

app.delete('/api/movies/:id', requireAuth, async (req, res) => {
    const movieId = parseFloat(req.params.id);

    try {
        await db.collection('users').updateOne(
            { username: req.session.username },
            { $pull: { movies: { id: movieId } } }
        );

        res.json({ message: 'Movie deleted' });
    } catch (error) {
        console.error('Error deleting movie:', error);
        res.status(500).json({ error: 'Failed to delete movie' });
    }
});

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});

process.on('SIGINT', async () => {
    await client.close();
    process.exit(0);
});