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

// Simple session with unique name to avoid conflicts
app.use(session({
    secret: process.env.SESSION_SECRET || 'temp-secret',
    name: 'movieapp' + Date.now(), // Unique session name each restart
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 60 * 1000 } // 30 minutes only
}));

async function connectDB() {
    try {
        await client.connect();
        db = client.db('movietracker');
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB error:', error);
        setTimeout(connectDB, 5000);
    }
}

function calculateRecommendation(rating) {
    if (rating >= 9.0) return "Must Watch";
    if (rating >= 7.5) return "Highly Recommended";  
    if (rating >= 6.0) return "Worth Watching";
    return "Skip";
}

// DEAD SIMPLE ROUTING
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/', (req, res) => {
    // EXPLICIT check - if no session, redirect
    if (!req.session || !req.session.userId) {
        console.log('No session found, redirecting');
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/results', (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'public', 'results.html'));
});

// API
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
                movies: []
            };
            const result = await db.collection('users').insertOne(user);
            req.session.userId = result.insertedId;
            req.session.username = username;
            return res.json({ message: 'Account created!' });
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
    req.session.destroy();
    res.json({ message: 'Logged out' });
});

app.get('/api/movies', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not logged in' });
    }
    
    db.collection('users').findOne({ username: req.session.username })
        .then(user => res.json(user?.movies || []))
        .catch(() => res.status(500).json({ error: 'Database error' }));
});

app.post('/api/movies', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not logged in' });
    }
    
    const { title, genre, rating } = req.body;
    const newMovie = {
        id: Date.now(),
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
    .catch(() => res.status(500).json({ error: 'Failed to add movie' }));
});

app.patch('/api/movies/:id/rating', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not logged in' });
    }
    
    const movieId = parseInt(req.params.id);
    const newRating = parseFloat(req.body.rating);
    
    db.collection('users').updateOne(
        { username: req.session.username, "movies.id": movieId },
        { $set: { 
            "movies.$.rating": newRating,
            "movies.$.recommendation": calculateRecommendation(newRating)
        }}
    )
    .then(() => res.json({ message: 'Updated' }))
    .catch(() => res.status(500).json({ error: 'Update failed' }));
});

app.delete('/api/movies/:id', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not logged in' });
    }
    
    db.collection('users').updateOne(
        { username: req.session.username },
        { $pull: { movies: { id: parseInt(req.params.id) } } }
    )
    .then(() => res.json({ message: 'Deleted' }))
    .catch(() => res.status(500).json({ error: 'Delete failed' }));
});

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on ${PORT}`);
        console.log('Fresh server start - no cached sessions');
    });
});

process.on('SIGINT', async () => {
    await client.close();
    process.exit(0);
});