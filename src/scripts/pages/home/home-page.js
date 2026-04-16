import { getData } from '../../data/api';
import HomePresenter from './home-presenter';

export default class HomePage {
  async render() {
    return `
      <section class="container">
        <h1 class="page-title">Home Page</h1>
        <div id="loading-container" class="loading-container">
          <p>Loading the future...</p>
        </div>
        <div id="data-container" class="card-grid"></div>
        <div id="error-container" class="error-container" style="display: none;"></div>
      </section>
    `;
  }

  async afterRender() {
    new HomePresenter({
      view: this,
      model: { getData }
    });
  }

  showLoading() {
    document.getElementById('loading-container').style.display = 'block';
    document.getElementById('data-container').innerHTML = '';
  }

  showData(data) {
    document.getElementById('loading-container').style.display = 'none';
    const dataContainer = document.getElementById('data-container');
    
    dataContainer.innerHTML = data.map(item => `
      <div class="card">
        <h3>${item.title}</h3>
        <p>${item.description}</p>
        <button class="card-btn">Explore</button>
      </div>
    `).join('');
  }

  showError(message) {
    document.getElementById('loading-container').style.display = 'none';
    const errorContainer = document.getElementById('error-container');
    errorContainer.innerText = message;
    errorContainer.style.display = 'block';
  }
}
