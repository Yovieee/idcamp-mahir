import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import StoryApi from '../../data/api';
import SessionHelper from '../../utils/session-helper';
import { PendingStoryIdb } from '../../data/idb-helper';

// Fix Leaflet marker icons in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

export default class AddStoryPage {
  constructor() {
    this._map = null;
    this._marker = null;
    this._stream = null;
    this._lat = null;
    this._lon = null;
    this._selectedFile = null;
  }

  async render() {
    if (!SessionHelper.isAuthenticated()) {
      window.location.hash = '/login';
      return '';
    }

    return `
      <section class="container">
        <header class="header-actions">
           <h1 class="page-title">Add New Story</h1>
           <a href="#/" class="btn-secondary">Back to Stories</a>
        </header>
        
        <div class="add-story-content">
          <h2 class="section-title">Story Details</h2>
          <form id="add-story-form" class="card">
            <div class="form-group">
              <label for="description">Description</label>
              <textarea id="description" name="description" rows="4" placeholder="Tell your story..." required class="form-input"></textarea>
            </div>

            <fieldset class="form-group border-none">
              <legend class="form-label font-bold">Image Source</legend>
              <div class="image-options">
                <button type="button" id="btn-file-source" class="btn-toggle active">Upload File</button>
                <button type="button" id="btn-camera-source" class="btn-toggle">Camera</button>
              </div>
            </fieldset>

            <div id="file-source-container" class="source-container">
              <div class="form-group">
                <label for="photo-file" class="form-label">Select Photo</label>
                <input type="file" id="photo-file" accept="image/*" class="file-input">
                <p class="input-hint">Select a photo from your device</p>
              </div>
            </div>

            <div id="camera-source-container" class="source-container hidden">
              <div class="camera-preview-wrapper">
                <video id="camera-preview" autoplay playsinline></video>
                <div class="camera-controls">
                  <button type="button" id="btn-start-camera" class="btn-primary">Start Camera</button>
                  <button type="button" id="btn-capture" class="btn-primary hidden">Capture</button>
                  <button type="button" id="btn-stop-camera" class="btn-secondary hidden">Stop Camera</button>
                </div>
              </div>
              <canvas id="camera-canvas" class="hidden"></canvas>
            </div>

            <div id="preview-container" class="preview-container hidden">
              <div class="preview-card">
                <img id="image-preview" src="" alt="Preview of your story photo">
                <button type="button" id="btn-remove-photo" class="btn-remove" aria-label="Remove photo">&times;</button>
              </div>
            </div>

            <h2 class="section-title">Location Details</h2>
            <fieldset class="form-group border-none">
              <legend class="form-label font-bold">Location (Optional - Click on map to select)</legend>
              <div id="add-map" class="map-container small"></div>
              <div class="lat-lon-info">
                <div class="coords">
                  <span>Lat: <b id="display-lat">-</b></span>
                  <span>Lon: <b id="display-lon">-</b></span>
                </div>
                <button type="button" id="btn-clear-location" class="btn-text">Clear Location</button>
              </div>
            </fieldset>

            <div id="status-message" class="error-container hidden"></div>

            <button type="submit" id="btn-submit" class="btn-primary">Post Story</button>
          </form>
        </div>
      </section>
    `;
  }

  async afterRender() {
    if (!SessionHelper.isAuthenticated()) return;

    this._initMap();
    this._initListeners();
  }

  _initMap() {
    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    });

    this._map = L.map('add-map', {
      center: [-2.5, 118],
      zoom: 5,
      layers: [osm]
    });

    this._map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      this._updateLocation(lat, lng);
    });

    // Fix map gray tiles bug in SPA
    setTimeout(() => {
      this._map.invalidateSize();
    }, 100);
  }

  _updateLocation(lat, lon) {
    this._lat = lat;
    this._lon = lon;
    
    document.getElementById('display-lat').innerText = lat.toFixed(6);
    document.getElementById('display-lon').innerText = lon.toFixed(6);

    if (this._marker) {
      this._marker.setLatLng([lat, lon]);
    } else {
      this._marker = L.marker([lat, lon]).addTo(this._map);
    }
  }

  _clearLocation() {
    this._lat = null;
    this._lon = null;
    document.getElementById('display-lat').innerText = '-';
    document.getElementById('display-lon').innerText = '-';
    if (this._marker) {
      this._map.removeLayer(this._marker);
      this._marker = null;
    }
  }

  _initListeners() {
    const fileSourceBtn = document.getElementById('btn-file-source');
    const cameraSourceBtn = document.getElementById('btn-camera-source');
    const fileContainer = document.getElementById('file-source-container');
    const cameraContainer = document.getElementById('camera-source-container');
    const photoInput = document.getElementById('photo-file');
    const startCameraBtn = document.getElementById('btn-start-camera');
    const stopCameraBtn = document.getElementById('btn-stop-camera');
    const captureBtn = document.getElementById('btn-capture');
    const video = document.getElementById('camera-preview');
    const removePhotoBtn = document.getElementById('btn-remove-photo');
    const clearLocBtn = document.getElementById('btn-clear-location');
    const form = document.getElementById('add-story-form');

    // Source Toggles
    fileSourceBtn.addEventListener('click', () => {
      fileSourceBtn.classList.add('active');
      cameraSourceBtn.classList.remove('active');
      fileContainer.classList.remove('hidden');
      cameraContainer.classList.add('hidden');
      this._stopCamera();
    });

    cameraSourceBtn.addEventListener('click', () => {
      cameraSourceBtn.classList.add('active');
      fileSourceBtn.classList.remove('active');
      cameraContainer.classList.remove('hidden');
      fileContainer.classList.add('hidden');
    });

    // File Input
    photoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this._showPreview(file);
      }
    });

    // Camera Logic
    startCameraBtn.addEventListener('click', async () => {
      try {
        this._stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = this._stream;
        startCameraBtn.classList.add('hidden');
        captureBtn.classList.remove('hidden');
        stopCameraBtn.classList.remove('hidden');
      } catch (err) {
        alert('Could not access camera: ' + err.message);
      }
    });

    captureBtn.addEventListener('click', () => {
      const canvas = document.getElementById('camera-canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        const file = new File([blob], 'captured-image.jpg', { type: 'image/jpeg' });
        this._showPreview(file);
        this._stopCamera();
      }, 'image/jpeg');
    });

    stopCameraBtn.addEventListener('click', () => this._stopCamera());

    removePhotoBtn.addEventListener('click', () => {
      this._hidePreview();
      photoInput.value = '';
    });

    clearLocBtn.addEventListener('click', () => this._clearLocation());

    // Form Submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this._handleSubmit();
    });

    // Handle back navigation / component destroy
    const handleNavigation = () => {
      this._stopCamera();
      window.removeEventListener('hashchange', handleNavigation);
    };
    window.addEventListener('hashchange', handleNavigation);
  }

  _showPreview(file) {
    const previewContainer = document.getElementById('preview-container');
    const previewImg = document.getElementById('image-preview');
    const reader = new FileReader();
    
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      previewContainer.classList.remove('hidden');
      this._selectedFile = file;
    };
    reader.readAsDataURL(file);
  }

  _hidePreview() {
    const previewContainer = document.getElementById('preview-container');
    previewContainer.classList.add('hidden');
    this._selectedFile = null;
  }

  _stopCamera() {
    if (this._stream) {
      this._stream.getTracks().forEach(track => track.stop());
      this._stream = null;
      
      const video = document.getElementById('camera-preview');
      if (video) video.srcObject = null;

      const startCameraBtn = document.getElementById('btn-start-camera');
      const stopCameraBtn = document.getElementById('btn-stop-camera');
      const captureBtn = document.getElementById('btn-capture');
      
      if (startCameraBtn) startCameraBtn.classList.remove('hidden');
      if (captureBtn) captureBtn.classList.add('hidden');
      if (stopCameraBtn) stopCameraBtn.classList.add('hidden');
    }
  }

  async _handleSubmit() {
    const description = document.getElementById('description').value;
    const submitBtn = document.getElementById('btn-submit');

    if (!this._selectedFile) {
      this._showStatus('Please select or capture an image.', 'error');
      return;
    }

    const storyData = {
      description,
      photo: this._selectedFile,
      lat: this._lat,
      lon: this._lon,
      token: SessionHelper.getToken(), // Save token for SW to use
    };

    if (!navigator.onLine) {
      try {
        await PendingStoryIdb.addStory(storyData);
        
        // Register background sync
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
          const registration = await navigator.serviceWorker.ready;
          await registration.sync.register('sync-stories');
        }

        alert('You are offline. Your story has been saved and will be uploaded automatically when you are back online.');
        window.location.hash = '#/';
        return;
      } catch (error) {
        this._showStatus('Failed to save story for offline sync.', 'error');
        console.error(error);
        return;
      }
    }

    try {
      submitBtn.disabled = true;
      submitBtn.innerText = 'Posting...';
      this._showStatus('Uploading story...', 'info');

      const result = await StoryApi.addStory(storyData);

      if (result.error) {
        this._showStatus(result.message, 'error');
      } else {
        alert('Story posted successfully!');
        window.location.hash = '#/';
      }
    } catch (error) {
      this._showStatus('Failed to post story. Please try again.', 'error');
      console.error(error);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = 'Post Story';
    }
  }

  _showStatus(message, type) {
    const statusMsg = document.getElementById('status-message');
    statusMsg.innerText = message;
    statusMsg.classList.remove('hidden', 'error-container', 'info-container');
    
    if (type === 'error') {
      statusMsg.classList.add('error-container');
    } else {
      statusMsg.classList.add('info-container');
    }
  }
}
