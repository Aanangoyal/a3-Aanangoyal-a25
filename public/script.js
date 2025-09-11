// Main JavaScript file for both index.html and results.html
document.addEventListener('DOMContentLoaded', function() {
  // Check which page we're on
  const currentPage = window.location.pathname;
  
  if (currentPage === '/' || currentPage.includes('index.html')) {
      initIndexPage();
  } else if (currentPage === '/results' || currentPage.includes('results.html')) {
      initResultsPage();
  }

  // Initialize index page functionality
  function initIndexPage() {
      const movieForm = document.getElementById('movieForm');
      const recentMoviesDiv = document.getElementById('recentMovies');

      if (!movieForm || !recentMoviesDiv) return;

      // Load recent movies on page load
      loadRecentMovies();

      // Handle form submission
      movieForm.addEventListener('submit', async function(e) {
          e.preventDefault();
          
          const formData = new FormData(movieForm);
          const movieData = {
              title: formData.get('title'),
              genre: formData.get('genre'),
              rating: parseFloat(formData.get('rating'))
          };

          try {
              const response = await fetch('/api/movies', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(movieData)
              });

              if (response.ok) {
                  const newMovie = await response.json();
                  movieForm.reset();
                  loadRecentMovies(); // Refresh the recent movies display
                  showSuccessMessage(`"${newMovie.title}" added successfully!`);
              } else {
                  const error = await response.json();
                  showErrorMessage(error.error || 'Failed to add movie');
              }
          } catch (error) {
              console.error('Error adding movie:', error);
              showErrorMessage('Network error. Please try again.');
          }
      });

      // Load and display recent movies
      async function loadRecentMovies() {
          try {
              const response = await fetch('/api/movies');
              const movies = await response.json();
              
              displayRecentMovies(movies.slice(-3).reverse()); // Show last 3 movies
          } catch (error) {
              console.error('Error loading movies:', error);
              recentMoviesDiv.innerHTML = '<p class="error">Failed to load recent movies.</p>';
          }
      }

      // Display recent movies in the preview section
      function displayRecentMovies(movies) {
          if (movies.length === 0) {
              recentMoviesDiv.innerHTML = '<p>No movies added yet. Add your first movie!</p>';
              return;
          }

          const moviesHTML = movies.map(movie => `
              <div class="movie-card">
                  <div class="movie-title">${escapeHtml(movie.title)}</div>
                  <div class="movie-details">
                      ${escapeHtml(movie.genre)} • Rating: ${movie.rating}/10 • ${movie.recommendation}
                  </div>
              </div>
          `).join('');

          recentMoviesDiv.innerHTML = moviesHTML;
      }
  }

  // Initialize results page functionality
  function initResultsPage() {
      const moviesTableBody = document.getElementById('moviesTableBody');
      const movieCountSpan = document.getElementById('movieCount');
      const emptyState = document.getElementById('emptyState');
      const moviesTable = document.getElementById('moviesTable');

      if (!moviesTableBody || !movieCountSpan) return;

      // Load all movies on page load
      loadAllMovies();

      // Load and display all movies
      async function loadAllMovies() {
          try {
              const response = await fetch('/api/movies');
              const movies = await response.json();
              
              displayMovies(movies);
              updateMovieCount(movies.length);
          } catch (error) {
              console.error('Error loading movies:', error);
              showErrorMessage('Failed to load movies.');
          }
      }

      // Display movies in the table
      function displayMovies(movies) {
          if (movies.length === 0) {
              if (moviesTable) moviesTable.style.display = 'none';
              if (emptyState) emptyState.style.display = 'block';
              return;
          }

          if (moviesTable) moviesTable.style.display = 'table';
          if (emptyState) emptyState.style.display = 'none';

          const moviesHTML = movies.map(movie => `
              <tr>
                  <td><strong>${escapeHtml(movie.title)}</strong></td>
                  <td>${escapeHtml(movie.genre)}</td>
                  <td>
                      <input type="number" class="rating-input" value="${movie.rating}" 
                          min="0" max="10" step="0.1" 
                          onchange="updateRating(${movie.id}, this.value)" />
                  </td>
                  <td>${formatDate(movie.dateAdded)}</td>
                  <td>
                      <span class="recommendation-badge ${getRecommendationClass(movie.recommendation)}">
                          ${escapeHtml(movie.recommendation)}
                      </span>
                  </td>
                  <td>
                      <button class="delete-btn" onclick="deleteMovie(${movie.id})">
                          Delete
                      </button>
                  </td>
              </tr>
          `).join('');

          moviesTableBody.innerHTML = moviesHTML;
      }

      // Update movie count display
      function updateMovieCount(count) {
          movieCountSpan.textContent = count;
      }

      // Make loadAllMovies available globally for delete function
      window.loadAllMovies = loadAllMovies;
  }

  // Delete movie function (global scope for onclick)
  window.deleteMovie = async function(movieId) {
      if (!confirm('Are you sure you want to delete this movie?')) {
          return;
      }

      try {
          const response = await fetch(`/api/movies/${movieId}`, {
              method: 'DELETE'
          });

          if (response.ok) {
              if (window.loadAllMovies) {
                  window.loadAllMovies(); // Refresh the movies list
              }
              showSuccessMessage('Movie deleted successfully!');
          } else {
              const error = await response.json();
              showErrorMessage(error.error || 'Failed to delete movie');
          }
      } catch (error) {
          console.error('Error deleting movie:', error);
          showErrorMessage('Network error. Please try again.');
      }
  };

  // Update movie rating
  window.updateRating = async function(movieId, newRating) {
      try {
          const response = await fetch(`/api/movies/${movieId}/rating`, {
              method: 'PATCH',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({ rating: parseFloat(newRating) })
          });

          if (response.ok) {
              loadAllMovies(); // Refresh the movies list
              showSuccessMessage('Rating updated successfully!');
          } else {
              const error = await response.json();
              showErrorMessage(error.error || 'Failed to update rating');
          }
      } catch (error) {
          console.error('Error updating rating:', error);
          showErrorMessage('Network error. Please try again.');
      }
  };

  // Utility functions used by both pages
  function getRatingClass(rating) {
      if (rating >= 8.5) return 'rating-excellent';
      if (rating >= 7.0) return 'rating-good';
      if (rating >= 5.0) return 'rating-average';
      return 'rating-poor';
  }

  function getRecommendationClass(recommendation) {
      const classMap = {
          'Must Watch': 'rec-must-watch',
          'Highly Recommended': 'rec-highly-recommended',
          'Worth Watching': 'rec-worth-watching',
          'Mediocre': 'rec-mediocre',
          'Skip': 'rec-skip'
      };
      return classMap[recommendation] || 'rec-worth-watching';
  }

  function formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
      });
  }

  function showSuccessMessage(message) {
      const messageDiv = document.createElement('div');
      messageDiv.textContent = message;
      messageDiv.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #48bb78;
          color: white;
          padding: 12px 20px;
          border-radius: 6px;
          z-index: 1000;
          font-weight: 500;
      `;
      document.body.appendChild(messageDiv);
      
      setTimeout(() => {
          document.body.removeChild(messageDiv);
      }, 3000);
  }

  function showErrorMessage(message) {
      const messageDiv = document.createElement('div');
      messageDiv.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #f56565;
          color: white;
          padding: 12px 20px;
          border-radius: 6px;
          z-index: 1000;
          font-weight: 500;
      `;
      messageDiv.textContent = message;
      document.body.appendChild(messageDiv);
      
      setTimeout(() => {
          document.body.removeChild(messageDiv);
      }, 3000);
  }

  function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
  }
});