export default class BookmarkPresenter {
  #view;
  #model;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  async showStoryListMap() {
    this.#view.showMapLoading();
    try {
      await this.#view.initialMap();
    } catch (error) {
      console.error('showStoryListMap: error:', error);
    } finally {
      this.#view.hideMapLoading();
    }
  }

  async initialStoriesAndMap() {
    this.#view.showLoading();
    try {
      if(!this.#view.isMapInitialized()) await this.showStoryListMap();
      let stories = await this.#model.getAllStories();

      console.log('Berhasil mendapatkan daftar laporan tersimpan.');
      this.#view.populateBookmarkedStories(stories);
    } catch (error) {
      console.error('initialStoriesAndMap: error:', error);
      this.#view.populateStoryListError(error.message);
    } finally {
      this.#view.hideLoading();
    }
  }
}
