import { FavoriteStoryIdb } from '../../data/idb-helper';
import SessionHelper from '../../utils/session-helper';

export default class FavoritePage {
  constructor() {
    this._stories = [];
    this._filteredStories = [];
  }

  async render() {
    if (!SessionHelper.isAuthenticated()) {
      window.location.hash = '/login';
      return '';
    }

    return `
      <section class="container">
        <header class="header-actions">
          <h1 class="page-title">Favorite Stories</h1>
          <div class="nav-links">
            <a href="#/" class="btn-secondary">Back to Feed</a>
          </div>
        </header>

        <div class="interactive-controls card">
          <div class="form-group search-group">
            <label for="search-input">Search Favorites</label>
            <input type="text" id="search-input" class="form-input" placeholder="Search by name or description...">
          </div>
          
          <div class="filter-sort-row">
            <div class="form-group">
              <label for="sort-select">Sort By</label>
              <select id="sort-select" class="form-input">
                <option value="newest">Date: Newest</option>
                <option value="oldest">Date: Oldest</option>
                <option value="name-asc">Name: A-Z</option>
                <option value="name-desc">Name: Z-A</option>
              </select>
            </div>
          </div>
        </div>

        <div id="loading-container" class="loading-container">
          <p>Loading favorites...</p>
        </div>
        
        <div id="data-container" class="card-grid"></div>
        <div id="empty-container" class="empty-container" style="display: none;">
          <p>No favorite stories found.</p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    if (!SessionHelper.isAuthenticated()) return;

    await this._loadData();
    this._initListeners();
  }

  async _loadData() {
    this.showLoading();
    this._stories = await FavoriteStoryIdb.getAllStories();
    this._filteredStories = [...this._stories];
    this.showData();
  }

  _initListeners() {
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');

    searchInput.addEventListener('input', () => {
      this._filterAndSort();
    });

    sortSelect.addEventListener('change', () => {
      this._filterAndSort();
    });
  }

  _filterAndSort() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const sortBy = document.getElementById('sort-select').value;

    // Filter
    this._filteredStories = this._stories.filter(story => 
      story.name.toLowerCase().includes(searchTerm) || 
      story.description.toLowerCase().includes(searchTerm)
    );

    // Sort
    this._filteredStories.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      return 0;
    });

    this.showData();
  }

  showLoading() {
    document.getElementById('loading-container').style.display = 'block';
    document.getElementById('data-container').innerHTML = '';
    document.getElementById('empty-container').style.display = 'none';
  }

  showData() {
    document.getElementById('loading-container').style.display = 'none';
    const dataContainer = document.getElementById('data-container');
    const emptyContainer = document.getElementById('empty-container');

    if (this._filteredStories.length === 0) {
      dataContainer.innerHTML = '';
      emptyContainer.style.display = 'block';
      return;
    }

    emptyContainer.style.display = 'none';
    dataContainer.innerHTML = this._filteredStories.map(item => `
      <article class="card story-card">
        <img src="${item.photoUrl}" alt="Story photo by ${item.name}" class="card-img" loading="lazy">
        <div class="card-content">
          <div class="card-header-row">
            <h3 class="card-name">${item.name}</h3>
            <button class="btn-favorite unfavorite" data-id="${item.id}" title="Remove from favorites">
              ❤️
            </button>
          </div>
          <p class="card-date">${new Date(item.createdAt).toLocaleDateString()}</p>
          <p class="card-desc">${item.description.substring(0, 150)}${item.description.length > 150 ? '...' : ''}</p>
        </div>
      </article>
    `).join('');

    this._setupFavoriteListeners();
  }

  _setupFavoriteListeners() {
    const favoriteButtons = document.querySelectorAll('.btn-favorite.unfavorite');
    favoriteButtons.forEach((button) => {
      button.addEventListener('click', async () => {
        const id = button.getAttribute('data-id');
        await FavoriteStoryIdb.deleteStory(id);
        
        // Update local state and re-render
        this._stories = this._stories.filter(s => s.id !== id);
        this._filterAndSort();
      });
    });
  }
}
