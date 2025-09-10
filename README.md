# Assignment 2 - Movie Rating Tracker

A simple two-tier web application for tracking movie ratings built with HTML, CSS, JavaScript, and Node.js.

## Application Description

This application allows users to add movies with ratings and view their complete movie database. The app automatically categorizes movies based on their ratings and maintains all data in server memory.

### Features
- Add new movies with title, rating (1-10), and release year
- Automatic categorization based on rating (derived field)
- View all movies in a table format
- Delete movies from the database
- Responsive design

### Derived Field Logic
The application calculates a "category" field for each movie based on its rating:
- Rating 9-10: "Excellent" 
- Rating 7-8: "Good"
- Rating 5-6: "Average"
- Rating 1-4: "Poor"

## Technical Implementation

### Baseline Requirements Met
1. **Server**: Node.js/Express server that maintains a tabular dataset with 4 fields (title, rating, year, category)
2. **Results functionality**: `/results` page shows entire dataset in a table
3. **Form/Entry functionality**: Form to add movies, buttons to delete movies
4. **Server Logic**: Automatic calculation of category field based on rating
5. **Derived field**: Category is computed from the rating field before storing

### HTML Requirements
- ✅ HTML Forms with text inputs, number inputs, and submit button
- ✅ Results page displaying all data in a table format
- ✅ All pages validate as proper HTML5
- ✅ Multiple pages accessible from homepage via navigation

### CSS Requirements
- ✅ Element selectors (body, header, table, etc.)
- ✅ ID selectors (#movieForm, #movieList, etc.)
- ✅ Class selectors (.container, .form-group, .movie-item, etc.)
- ✅ Flexbox layout for main content areas
- ✅ Google Fonts (Roboto) used throughout
- ✅ External stylesheet (styles.css)

### JavaScript Requirements
- ✅ Front-end JavaScript for fetching data from server
- ✅ Form submission handling
- ✅ Dynamic DOM manipulation

### Node.js Requirements
- ✅ Express HTTP server serving files and handling API requests
- ✅ Server-side calculation of derived fields
- ✅ RESTful API endpoints for CRUD operations

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