import StoryApi from '../../data/api';
import SessionHelper from '../../utils/session-helper';

export default class HomePage {
  async render() {
    if (!SessionHelper.isAuthenticated()) {
      window.location.hash = '/login';
      return '';
    }

    return `
      <section class="container">
        <header class="header-actions">
          <h1 class="page-title">Latest Stories</h1>
          <div class="nav-links">
            <a href="#/map" class="btn-secondary">View Map</a>
            <button id="logout-btn" class="btn-text">Logout</button>
          </div>
        </header>
        <div id="loading-container" class="loading-container">
          <p>Fetching stories...</p>
        </div>
        <div id="data-container" class="card-grid"></div>
        <div id="error-container" class="error-container" style="display: none;"></div>
      </section>
    `;
  }

  async afterRender() {
    if (!SessionHelper.isAuthenticated()) return;

    this._setupHeaderActions();
    await this._loadData();
  }

  _setupHeaderActions() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        SessionHelper.removeToken();
        window.location.hash = '/login';
      });
    }
  }

  async _loadData() {
    this.showLoading();
    try {
      const result = await StoryApi.getStories();
      if (result.error) {
        this.showError(result.message);
      } else {
        this.showData(result.listStory);
      }
    } catch (error) {
      this.showError('Failed to load stories. Please try again.');
    }
  }

  showLoading() {
    document.getElementById('loading-container').style.display = 'block';
    document.getElementById('data-container').innerHTML = '';
  }

  showData(data) {
    document.getElementById('loading-container').style.display = 'none';
    const dataContainer = document.getElementById('data-container');
    
    dataContainer.innerHTML = data.map(item => `
      <article class="card story-card">
        <img src="${item.photoUrl}" alt="Story photo by ${item.name}" class="card-img" loading="lazy">
        <div class="card-content">
          <h3 class="card-name">${item.name}</h3>
          <p class="card-date">${new Date(item.createdAt).toLocaleDateString()}</p>
          <p class="card-desc">${item.description.substring(0, 150)}${item.description.length > 150 ? '...' : ''}</p>
        </div>
      </article>
    `).join('');
  }

  showError(message) {
    document.getElementById('loading-container').style.display = 'none';
    const errorContainer = document.getElementById('error-container');
    errorContainer.innerText = message;
    errorContainer.style.display = 'block';
  }
}
