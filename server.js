require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB setup
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

// Debug middleware (can remove in production)
app.use((req, res, next) => {
    // Only log non-static file requests
    if (!req.url.includes('.') && !req.url.includes('favicon')) {
        console.log('Request:', {
            url: req.url,
            sessionId: req.sessionID?.substring(0, 8) + '...',
            userId: req.session?.userId ? 'logged-in' : 'anonymous',
            method: req.method
        });
    }
    next();
});

// FIXED: Improved auth middleware - only protect specific routes
const requireAuth = (req, res, next) => {
    // Only protect main app routes, not static files or login
    const protectedRoutes = ['/', '/results'];
    
    if (!protectedRoutes.includes(req.path)) {
        return next();
    }
    
    if (!req.session.userId) {
        console.log('No valid session, redirecting to login');
        return res.redirect('/login');
    }
    
    next();
};

// Apply auth middleware
app.use(requireAuth);

// Connect to MongoDB with retry logic
async function connectDB() {
    try {
        await client.connect();
        db = client.db('movietracker');
        console.log('Connected to MongoDB');
        
        // Create index on username for better performance
        await db.collection('users').createIndex({ username: 1 }, { unique: true });
    } catch (error) {
        console.error('MongoDB connection error:', error);
        console.log('Retrying connection in 5 seconds...');
        setTimeout(connectDB, 5000);
    }
}

// Helper function to calculate recommendation
function calculateRecommendation(rating) {
    if (rating >= 9.0) return "Must Watch";
    if (rating >= 7.5) return "Highly Recommended";
    if (rating >= 6.0) return "Worth Watching";
    return "Skip";
}

// Routes - Main app pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/results', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'results.html'));
});

// Login page - redirect if already logged in
app.get('/login', (req, res) => {
    if (req.session.userId) {
        console.log('User already logged in, redirecting to home');
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// FIXED: Add logout route to clear session and redirect
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/login');
    });
});

// API Routes
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    // FIXED: Input validation - trim whitespace
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (trimmedUsername.length < 1 || trimmedPassword.length < 1) {
        return res.status(400).json({ error: 'Username and password cannot be empty' });
    }

    try {
        let user = await db.collection('users').findOne({ username: trimmedUsername });
        
        if (!user) {
            // Create new user
            const hashedPassword = await bcrypt.hash(trimmedPassword, 10);
            user = {
                username: trimmedUsername,
                password: hashedPassword,
                movies: [],
                createdAt: new Date()
            };
            
            const result = await db.collection('users').insertOne(user);
            req.session.userId = result.insertedId;
            req.session.username = trimmedUsername;
            console.log('New user created:', trimmedUsername);
            return res.json({ message: 'Account created successfully!' });
        }
        
        // Check password
        const validPassword = await bcrypt.compare(trimmedPassword, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid password' });
        }
        
        req.session.userId = user._id;
        req.session.username = trimmedUsername;
        console.log('User logged in:', trimmedUsername);
        res.json({ message: 'Login successful' });
    } catch (error) {
        console.error('Login error:', error);
        
        // FIXED: Handle duplicate username error
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        
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

// Movie API routes
app.get('/api/movies', (req, res) => {
    // FIXED: Check authentication in API routes too
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    db.collection('users')
        .findOne({ username: req.session.username })
        .then(user => {
            res.json(user?.movies || []);
        })
        .catch(error => {
            console.error('Error fetching movies:', error);
            res.status(500).json({ error: 'Failed to fetch movies' });
        });
});

app.post('/api/movies', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const { title, genre, rating } = req.body;
    
    // FIXED: Better input validation
    if (!title?.trim() || !genre?.trim() || rating === undefined || rating === '') {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const numRating = parseFloat(rating);
    if (isNaN(numRating) || numRating < 0 || numRating > 10) {
        return res.status(400).json({ error: 'Rating must be between 0 and 10' });
    }

    const newMovie = {
        id: Date.now() + Math.random(), // FIXED: Better unique ID generation
        title: title.trim(),
        genre: genre.trim(),
        rating: numRating,
        dateAdded: new Date().toISOString(),
        recommendation: calculateRecommendation(numRating)
    };

    db.collection('users')
        .updateOne(
            { username: req.session.username },
            { $push: { movies: newMovie } }
        )
        .then(() => {
            res.json(newMovie);
        })
        .catch(error => {
            console.error('Error adding movie:', error);
            res.status(500).json({ error: 'Failed to add movie' });
        });
});

app.patch('/api/movies/:id/rating', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const movieId = parseFloat(req.params.id);
    const { rating } = req.body;

    const newRating = parseFloat(rating);
    if (isNaN(newRating) || newRating < 0 || newRating > 10) {
        return res.status(400).json({ error: 'Rating must be between 0 and 10' });
    }

    const newRecommendation = calculateRecommendation(newRating);
    
    db.collection('users')
        .updateOne(
            { username: req.session.username, "movies.id": movieId },
            { 
                $set: { 
                    "movies.$.rating": newRating,
                    "movies.$.recommendation": newRecommendation
                }
            }
        )
        .then(result => {
            if (result.matchedCount === 0) {
                return res.status(404).json({ error: 'Movie not found' });
            }
            res.json({ message: 'Rating updated' });
        })
        .catch(error => {
            console.error('Error updating rating:', error);
            res.status(500).json({ error: 'Failed to update rating' });
        });
});

app.delete('/api/movies/:id', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const movieId = parseFloat(req.params.id);

    db.collection('users')
        .updateOne(
            { username: req.session.username },
            { $pull: { movies: { id: movieId } } }
        )
        .then(result => {
            if (result.matchedCount === 0) {
                return res.status(404).json({ error: 'Movie not found' });
            }
            res.json({ message: 'Movie deleted' });
        })
        .catch(error => {
            console.error('Error deleting movie:', error);
            res.status(500).json({ error: 'Failed to delete movie' });
        });
});

// FIXED: Add 404 handler for unknown routes
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log('Visit: https://a3-aanangoyal-a25.onrender.com');
    });
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down server...');
    await client.close();
    process.exit(0);
});