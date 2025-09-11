# Movie Rating Tracker - Aanan Goyal

A two-tier web application for tracking movie ratings, built with HTML, CSS, JavaScript, and Node.js.

## Features

- Add movies with title, rating (1-10), and release year.
- Automatic categorization of movies based on rating:
  - Rating 9-10: "Excellent"
  - Rating 7-8: "Good"
  - Rating 5-6: "Average"
  - Rating 1-4: "Poor"
- View all movies in a table format.
- Delete movies from the database.
- Responsive design for mobile and desktop.

## Technical Overview

### Server
- Built with Node.js and Express.
- Maintains a dataset with fields: title, rating, year, and category.
- RESTful API for CRUD operations.
- Automatically calculates the "category" field based on the rating.

### Front-End
- HTML5 forms for adding movies.
- Results page displays all movies in a table.
- Dynamic DOM manipulation using JavaScript.
- Responsive design using Flexbox and Google Fonts.

## File Structure
```
/
├── server.js          # Main server file
├── package.json       # Project configuration
├── README.md          # This file
└── public/
    ├── index.html     # Homepage with form
    ├── results.html   # Results page with table
    ├── styles.css     # CSS styling
    ├── script.js      # Homepage JavaScript
    └── results.js     # Results page JavaScript
```

## Installation and Setup

1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `npm start` to start the server
4. Open browser to `http://localhost:3000`

## Deployment

This application is designed to be deployed on Render as a Web Service. The package.json includes the necessary configuration for deployment.

## Design Decisions

- Simple, clean interface focusing on functionality over aesthetics (appropriate for student project)
- Basic color scheme with blue accents
- Responsive design that works on mobile devices  
- Straightforward navigation between two main pages
- Conservative use of animations and effects
- Standard web fonts for broad compatibility