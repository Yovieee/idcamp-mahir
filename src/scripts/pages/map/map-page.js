import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import StoryApi from '../../data/api';
import SessionHelper from '../../utils/session-helper';

// Fix Leaflet marker icons in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

export default class MapPage {
  constructor() {
    this._map = null;
    this._layers = {};
    this._markers = [];
    this._stories = [];
  }

  async render() {
    if (!SessionHelper.isAuthenticated()) {
      window.location.hash = '/login';
      return '';
    }

    return `
      <section class="container">
        <h1 class="page-title">Story Map Explorer</h1>
        <div class="map-controls">
          <input type="text" id="map-search" placeholder="Filter by name or description..." class="search-input">
        </div>
        <div id="map" class="map-container"></div>
      </section>
    `;
  }

  async afterRender() {
    if (!SessionHelper.isAuthenticated()) return;

    this._initMap();
    await this._loadMarkers();
    this._addSearchListener();
  }

  _initMap() {
    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    });

    const cartoVoyager = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    });

    this._map = L.map('map', {
      center: [-2.5, 118], // Center for Indonesia
      zoom: 5,
      layers: [osm]
    });

    const baseMaps = {
      "OpenStreetMap": osm,
      "Carto Voyager": cartoVoyager
    };

    L.control.layers(baseMaps).addTo(this._map);
  }

  async _loadMarkers() {
    try {
      const result = await StoryApi.getStories(1);
      if (result.error) {
        alert(result.message);
        return;
      }

      this._stories = result.listStory;
      this._renderMarkers(this._stories);
    } catch (error) {
      console.error('Failed to fetch stories with location:', error);
    }
  }

  _renderMarkers(stories) {
    // Clear existing markers
    this._markers.forEach(marker => this._map.removeLayer(marker));
    this._markers = [];

    stories.forEach(story => {
      if (story.lat !== null && story.lon !== null) {
        const marker = L.marker([story.lat, story.lon]).addTo(this._map);
        
        const popupContent = `
          <div class="map-popup">
            <img src="${story.photoUrl}" alt="${story.name}" class="popup-img">
            <h3>${story.name}</h3>
            <p>${story.description.substring(0, 100)}${story.description.length > 100 ? '...' : ''}</p>
            <span class="popup-date">${new Date(story.createdAt).toLocaleDateString()}</span>
          </div>
        `;
        
        marker.bindPopup(popupContent);
        this._markers.push(marker);
      }
    });

    if (this._markers.length > 0) {
      const group = new L.featureGroup(this._markers);
      this._map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  _addSearchListener() {
    const searchInput = document.getElementById('map-search');
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const filteredStories = this._stories.filter(story => 
        story.name.toLowerCase().includes(query) || 
        story.description.toLowerCase().includes(query)
      );
      this._renderMarkers(filteredStories);
    });
  }
}
