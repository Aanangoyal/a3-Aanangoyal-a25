document.addEventListener('DOMContentLoaded', function() {
  const movieForm = document.getElementById('movieForm');
  const movieList = document.getElementById('movieList');
  
  // Load movies when page loads
  loadMovies();
  
  // Handle form submission
  movieForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const formData = new FormData(movieForm);
      const movieData = {
          title: formData.get('title'),
          rating: formData.get('rating'),
          year: formData.get('year')
      };
      
      // Send data to server
      fetch('/api/movies', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(movieData)
      })
      .then(response => response.json())
      .then(data => {
          console.log('Movie added:', data);
          movieForm.reset();
          loadMovies(); // Reload the movie list
      })
      .catch(error => {
          console.error('Error:', error);
          alert('Error adding movie. Please try again.');
      });
  });
  
  // Function to load and display movies
  function loadMovies() {
      fetch('/api/movies')
      .then(response => response.json())
      .then(movies => {
          displayMovies(movies);
      })
      .catch(error => {
          console.error('Error loading movies:', error);
      });
  }
  
  // Function to display movies
  function displayMovies(movies) {
      if (movies.length === 0) {
          movieList.innerHTML = '<p>No movies added yet. Add your first movie above!</p>';
          return;
      }
      
      // Show only the last 3 movies on home page
      const recentMovies = movies.slice(-3).reverse();
      
      movieList.innerHTML = recentMovies.map(movie => `
          <div class="movie-item">
              <div class="movie-title">${movie.title}</div>
              <div class="movie-details">
                  Rating: ${movie.rating}/10 | 
                  Year: ${movie.year} | 
                  Category: <span class="category-${movie.category.toLowerCase()}">${movie.category}</span>
              </div>
          </div>
      `).join('');
  }
});