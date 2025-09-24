# Movie Rating Tracker - Aanan Goyal

https://a3-aanangoyal.onrender.com

A web application for tracking movie ratings with user authentication and persistent storage. Built with Express, MongoDB, and Bootstrap.

## Features

- **User Authentication**: Simple login system that creates accounts on first login
- **Personal Movie Collections**: Each user has their own private movie list
- **Full CRUD Operations**: Add, view, update ratings, and delete movies
- **Automatic Recommendations**: Movies categorized as Must Watch, Highly Recommended, Worth Watching, or Skip
- **Responsive Design**: Clean Bootstrap-based UI that works on all devices

## Authentication Strategy

I chose simple username/password authentication because it was straightforward to implement and meets the assignment requirements. New accounts are automatically created on first login, which is clearly communicated to users on the login page.

## CSS Framework

I used **Bootstrap 5.3** because:
- Provides professional-looking components out of the box
- Excellent documentation and widespread adoption
- Built-in responsive design
- Minimal custom CSS needed

**Custom CSS modifications**: Added gradient background for login page and some custom styling for alert positioning.

## Express Middleware Packages

- **express-session**: Manages user sessions and login state
- **bcryptjs**: Hashes passwords securely before storing in database
- **dotenv**: Loads environment variables from .env file for MongoDB connection
- **mongodb**: Official MongoDB Node.js driver for database operations

## Database Design

Uses MongoDB with a simple schema:
- **users collection**: `{ username, password, movies: [], createdAt }`
- Movies are stored as embedded documents in user records for simplicity

## Login Instructions

Use any username/password combination. If the account doesn't exist, it will be created automatically. For testing, you can use:
- Username: `test`
- Password: `password`