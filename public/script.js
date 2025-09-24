document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname;
    
    if (currentPage === '/') {
        initIndexPage();
    } else if (currentPage === '/results') {
        initResultsPage();
    }

    function initIndexPage() {
        const form = document.getElementById('movieForm');
        if (!form) return;
        
        loadRecentMovies();
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const data = {
                title: document.getElementById('title').value,
                genre: document.getElementById('genre').value,
                rating: document.getElementById('rating').value
            };

            try {
                const response = await fetch('/api/movies', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    form.reset();
                    loadRecentMovies();
                    showMessage('Movie added successfully!', 'success');
                } else {
                    const error = await response.json();
                    showMessage(error.error, 'danger');
                }
            } catch (error) {
                showMessage('Failed to add movie', 'danger');
            }
        });

        async function loadRecentMovies() {
            try {
                const response = await fetch('/api/movies');
                const movies = await response.json();
                displayRecentMovies(movies.slice(-3).reverse());
            } catch (error) {
                document.getElementById('recentMovies').innerHTML = '<p class="text-danger">Failed to load movies</p>';
            }
        }

        function displayRecentMovies(movies) {
            const container = document.getElementById('recentMovies');
            if (movies.length === 0) {
                container.innerHTML = '<p class="text-muted">No movies yet</p>';
                return;
            }

            container.innerHTML = movies.map(movie => `
                <div class="border-start border-3 border-primary ps-3 mb-2">
                    <div class="fw-bold">${escapeHtml(movie.title)}</div>
                    <small class="text-muted">${movie.genre} • ${movie.rating}/10 • ${movie.recommendation}</small>
                </div>
            `).join('');
        }
    }

    function initResultsPage() {
        loadAllMovies();

        async function loadAllMovies() {
            try {
                const response = await fetch('/api/movies');
                const movies = await response.json();
                displayMovies(movies);
                document.getElementById('movieCount').textContent = movies.length;
            } catch (error) {
                showMessage('Failed to load movies', 'danger');
            }
        }

        function displayMovies(movies) {
            const tbody = document.getElementById('moviesTableBody');
            const table = document.getElementById('moviesTable');
            const emptyState = document.getElementById('emptyState');

            if (movies.length === 0) {
                table.style.display = 'none';
                emptyState.style.display = 'block';
                return;
            }

            table.style.display = 'table';
            emptyState.style.display = 'none';

            tbody.innerHTML = movies.map(movie => `
                <tr>
                    <td><strong>${escapeHtml(movie.title)}</strong></td>
                    <td><span class="badge bg-secondary">${movie.genre}</span></td>
                    <td>
                        <input type="number" class="form-control form-control-sm" 
                               style="width: 80px" value="${movie.rating}" 
                               min="0" max="10" step="0.1" 
                               onchange="updateRating(${movie.id}, this.value)">
                    </td>
                    <td>${formatDate(movie.dateAdded)}</td>
                    <td><span class="badge ${getRecBadge(movie.recommendation)}">${movie.recommendation}</span></td>
                    <td>
                        <button class="btn btn-danger btn-sm" onclick="deleteMovie(${movie.id})">
                            Delete
                        </button>
                    </td>
                </tr>
            `).join('');
        }

        window.loadAllMovies = loadAllMovies;
    }

    window.deleteMovie = async function(id) {
        if (!confirm('Delete this movie?')) return;
        
        try {
            const response = await fetch(`/api/movies/${id}`, { method: 'DELETE' });
            if (response.ok) {
                if (window.loadAllMovies) window.loadAllMovies();
                showMessage('Movie deleted', 'success');
            }
        } catch (error) {
            showMessage('Delete failed', 'danger');
        }
    };

    window.updateRating = async function(id, rating) {
        try {
            const response = await fetch(`/api/movies/${id}/rating`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rating: parseFloat(rating) })
            });
            
            if (response.ok && window.loadAllMovies) {
                window.loadAllMovies();
                showMessage('Rating updated', 'success');
            }
        } catch (error) {
            showMessage('Update failed', 'danger');
        }
    };

    function getRecBadge(rec) {
        const badges = {
            'Must Watch': 'bg-danger',
            'Highly Recommended': 'bg-primary',
            'Worth Watching': 'bg-success',
            'Skip': 'bg-secondary'
        };
        return badges[rec] || 'bg-secondary';
    }

    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString();
    }

    function showMessage(message, type) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alert.style.cssText = 'top: 20px; right: 20px; z-index: 1050; min-width: 300px;';
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(alert);
        setTimeout(() => alert.remove(), 3000);
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});