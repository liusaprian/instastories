import {
  generateLoaderAbsoluteTemplate,
  generateStoryItemTemplate,
  generateBookmarkedStoriesListEmptyTemplate,
  generateStoriesListErrorTemplate,
} from '../../templates';
import BookmarkPresenter from './bookmark-presenter';
import Database from '../../data/database';
import Map from '../../utils/map';

export default class BookmarkPage {
  #presenter = null;
  #map = null;

  async render() {
    return `
      <section>
        <div class="story-list__map__container">
          <div id="map" class="story-list__map"></div>
          <div id="map-loading-container"></div>
        </div>
      </section>

      <section class="container">
        <h1 class="section-title">Daftar Story Tersimpan</h1>

        <div class="story-list__container">
          <div id="story-list"></div>
          <div id="story-list-loading-container"></div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new BookmarkPresenter({
      view: this,
      model: Database,
    });

    await this.#presenter.initialStoriesAndMap();
  }

  populateBookmarkedStories(stories) {
    if (stories.length <= 0) {
      this.populateStoryListEmpty();
      return;
    }

    this.#map.removeAllMarkers();
    const html = stories.reduce((accumulator, story) => {
      if (this.#map) {
        const coordinate = [story.lat, story.lon];
        const markerOptions = { alt: story.name };
        const popupOptions = { content: story.name };
        this.#map.addMarker(coordinate, markerOptions, popupOptions);
      }
      return accumulator.concat(
        generateStoryItemTemplate({
          ...story
        }),
      );
    }, '');

    document.getElementById('story-list').innerHTML = `
      <div class="stories">${html}</div>
    `;
  }

  populateStoryListEmpty() {
    document.getElementById('story-list').innerHTML = generateBookmarkedStoriesListEmptyTemplate();
  }

  populateStoryListError(message) {
    document.getElementById('story-list').innerHTML = generateStoriesListErrorTemplate(message);
  }

  showLoading() {
    document.getElementById('story-list-loading-container').innerHTML =
      generateLoaderAbsoluteTemplate();
  }

  hideLoading() {
    document.getElementById('story-list-loading-container').innerHTML = '';
  }
  
  async initialMap() {
    this.#map = await Map.build('#map', {
      zoom: 10,
      locate: true,
      scrollWheelZoom: true,
    });
  }

  isMapInitialized() {
    if(this.#map == null) return false;
    return true;
  }

  showMapLoading() {
    document.getElementById('map-loading-container').innerHTML = generateLoaderAbsoluteTemplate();
  }

  hideMapLoading() {
    document.getElementById('map-loading-container').innerHTML = '';
  }
}
