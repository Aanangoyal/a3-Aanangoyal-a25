# Movie Rating Tracker - Aanan Goyal

https://a3-aanangoyal-a25.onrender.com

A web application for tracking movie ratings with user authentication and persistent storage. Built with Express, MongoDB, and Bootstrap.

## Features

- User authentication with automatic account creation
- Personal movie collections with ratings and recommendations
- Full CRUD operations (add, update ratings, delete movies)
- Persistent MongoDB storage
- Responsive Bootstrap design

## Authentication Strategy

I chose simple username/password authentication because it was straightforward to implement and meets the assignment requirements. New accounts are automatically created on first login.

## CSS Framework

I used **Bootstrap 5.3** because it provides professional components with minimal custom CSS needed and has excellent documentation.

**Custom CSS modifications**: Added gradient background for login page and alert positioning styles.

## Express Middleware Packages

- **express-session**: Manages user sessions and login state
- **bcryptjs**: Hashes passwords securely before database storage
- **dotenv**: Loads environment variables from .env file for MongoDB connection
- **mongodb**: Official MongoDB Node.js driver for database operations

## Database Design

Uses MongoDB with simple schema:
- **users collection**: `{ username, password, movies: [], createdAt }`
- Movies stored as embedded documents for simplicity and better performance

## Login Instructions

Use any username/password combination. If account doesn't exist, it will be created automatically.
For testing: Username `test`, Password `password`