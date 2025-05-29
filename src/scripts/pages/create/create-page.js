import CreatePresenter from './create-presenter';
import { convertBase64ToBlob } from '../../utils';
import * as StoryAPI from '../../data/api';
import { generateLoaderAbsoluteTemplate } from '../../templates';
import Camera from '../../utils/camera';
import Map from '../../utils/map';

export default class CreatePage {
  #presenter;
  #form;
  #camera;
  #isCameraOpen = false;
  #photo = null;
  #map = null;

  async render() {
    return `
      <section>
        <div class="new-story__header">
          <div class="container">
            <h1 class="new-story__header__title">Buat Story Baru</h1>
            <p class="new-story__header__description">
              Bagikan ceritamu dengan dunia!
            </p>
          </div>
        </div>
      </section>
  
      <section class="container">
        <div class="new-form__container">
          <form id="new-form" class="new-form">
  
            <div class="form-control">
              <label for="description-input" class="new-form__description__title">Deskripsi</label>
  
              <div class="new-form__description__container">
                <textarea
                  id="description-input"
                  name="description"
                  placeholder="Masukkan deskripsi story kamu. Kamu dapat menulis apa yg ingin kamu ceritakan, dimana, kapan, dll."
                ></textarea>
              </div>
            </div>
            <div class="form-control">
              <label for="photo-input" class="new-form__photo__title">Foto</label>
              <div id="photo-more-info">Anda dapat menyertakan foto juga loh!</div>
  
              <div class="new-form__photo__container">
                <div class="new-form__photo__buttons">
                  <button id="photo-input-button" class="btn btn-outline" type="button">
                    Ambil Gambar
                  </button>
                  <input
                    id="photo-input"
                    name="photo"
                    type="file"
                    accept="image/*"
                    multiple
                    hidden="hidden"
                    aria-multiline="true"
                    aria-describedby="photo-more-info"
                  >
                  <button id="open-photo-camera-button" class="btn btn-outline" type="button">
                    Buka Kamera
                  </button>
                </div>
                <div id="camera-container" class="new-form__camera__container">
                  <video id="camera-video" class="new-form__camera__video">
                    Video stream not available.
                  </video>
                  <canvas id="camera-canvas" class="new-form__camera__canvas"></canvas>
  
                  <div class="new-form__camera__tools">
                    <select id="camera-select"></select>
                    <div class="new-form__camera__tools_buttons">
                      <button id="camera-take-button" class="btn" type="button">
                        Ambil Gambar
                      </button>
                    </div>
                  </div>
                </div>
                <div id="photo-taken-list" class="new-form__photo__output"></div>
              </div>
            </div>
            <div class="form-control">
              <div class="new-form__location__title">Lokasi</div>
  
              <div class="new-form__location__container">
                <div class="new-form__location__map__container">
                  <div id="map" class="new-form__location__map"></div>
                  <div id="map-loading-container"></div>
                </div>
                <div class="new-form__location__lat-lng">
                  <label for="latitude" class="new-form__location__title">Lat</label>
                  <input type="number" name="latitude" value="-6.175389" disabled>
                  <label for="longitude" class="new-form__location__title">Long</label>
                  <input type="number" name="longitude" value="106.827139" disabled>
                </div>
              </div>
            </div>
            <div class="form-buttons">
              <span id="submit-button-container">
                <button class="btn" type="submit">Buat Story</button>
              </span>
              <a class="btn btn-outline" href="#/">Batal</a>
            </div>
          </form>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new CreatePresenter({
      view: this,
      model: StoryAPI,
    });
    this.#photo = null;

    this.#presenter.showNewFormMap();
    this.#setupForm();
  }

  #setupForm() {
    this.#form = document.getElementById('new-form');
    this.#form.addEventListener('submit', async (event) => {
      event.preventDefault();
      
      const data = {
        description: this.#form.elements.namedItem('description').value,
        photo: this.#photo.blob,
        lat: this.#form.elements.namedItem('latitude').value,
        lon: this.#form.elements.namedItem('longitude').value,
      };
      await this.#presenter.postNewStory(data);
    });

    document.getElementById('photo-input').addEventListener('change', async (event) => {
      const file = event.target.files[0];
      if (file) {
        await this.#addTakenPicture(file);
        await this.#populateTakenPictures();
      }
    });

    document.getElementById('photo-input-button').addEventListener('click', () => {
      this.#form.elements.namedItem('photo-input').click();
    });

    const cameraContainer = document.getElementById('camera-container');
    document
      .getElementById('open-photo-camera-button')
      .addEventListener('click', async (event) => {
        cameraContainer.classList.toggle('open');
        this.#isCameraOpen = cameraContainer.classList.contains('open');

        if (this.#isCameraOpen) {
          event.currentTarget.textContent = 'Tutup Kamera';
          this.#setupCamera();
          await this.#camera.launch();

          return;
        }

        event.currentTarget.textContent = 'Buka Kamera';
        this.#camera.stop();
      });
  }

  async initialMap() {
    this.#map = await Map.build('#map', {
      zoom: 15,
      locate: true,
    });
 
    // Preparing marker for select coordinate
    const centerCoordinate = this.#map.getCenter();
 
    this.#updateLatLngInput(centerCoordinate.latitude, centerCoordinate.longitude);
    const draggableMarker = this.#map.addMarker(
      [centerCoordinate.latitude, centerCoordinate.longitude],
      { draggable: 'true' },
    );
    draggableMarker.addEventListener('move', (event) => {
      const coordinate = event.target.getLatLng();
      this.#updateLatLngInput(coordinate.lat, coordinate.lng);
    });
 
    this.#map.addMapEventListener('click', (event) => {
      draggableMarker.setLatLng(event.latlng);
      event.sourceTarget.flyTo(event.latlng);
    });
  }

  #updateLatLngInput(latitude, longitude) {
    this.#form.elements.namedItem('latitude').value = latitude;
    this.#form.elements.namedItem('longitude').value = longitude;
  }

  #setupCamera() {
    if (!this.#camera) {
      this.#camera = new Camera({
        video: document.getElementById('camera-video'),
        cameraSelect: document.getElementById('camera-select'),
        canvas: document.getElementById('camera-canvas'),
      });
    }

    this.#camera.addCheeseButtonListener('#camera-take-button', async () => {
      const image = await this.#camera.takePicture();
      await this.#addTakenPicture(image);
      await this.#populateTakenPictures();
    });
  }

  async #addTakenPicture(image) {
    let blob = image;

    if (image instanceof String) {
      blob = await convertBase64ToBlob(image, 'image/png');
    }

    const newPhoto = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      blob: blob,
    };
    this.#photo = newPhoto;
  }

  async #populateTakenPictures() {
    let html = '';
    if(this.#photo != null) {
      const imageUrl = URL.createObjectURL(this.#photo.blob);
      html = `
        <div class="new-form__photo__output-item">
          <button type="button" data-deletepictureid="${this.#photo.id}" class="new-form__photo__output-item__delete-btn">
            <img src="${imageUrl}" alt="Foto story">
          </button>
        </div>
      `;
    }

    document.getElementById('photo-taken-list').innerHTML = html;

    document.querySelector('button[data-deletepictureid]').addEventListener('click', () => {
      this.#removePicture();
    });
  }

  #removePicture() {
    this.#photo = null;
    document.getElementById('photo-taken-list').innerHTML = '';
  }

  storeSuccessfully(message) {
    console.log(message);
    this.clearForm();

    // Redirect page
    location.hash = '/';
  }

  storeFailed(message) {
    alert(message);
  }

  clearForm() {
    this.#form.reset();
  }

  showMapLoading() {
    document.getElementById('map-loading-container').innerHTML = generateLoaderAbsoluteTemplate();
  }

  hideMapLoading() {
    document.getElementById('map-loading-container').innerHTML = '';
  }

  showSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML = `
      <button class="btn" type="submit" disabled>
        <i class="fas fa-spinner loader-button"></i> Buat Story
      </button>
    `;
  }

  hideSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML = `
      <button class="btn" type="submit">Buat Story</button>
    `;
  }
}
