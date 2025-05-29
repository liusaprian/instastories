export default class StoryDetailPresenter {
  #id;
  #view;
  #apiModel;
  #dbModel;

  constructor(id, { view, apiModel, dbModel }) {
    this.#id = id;
    this.#view = view;
    this.#apiModel = apiModel;
    this.#dbModel = dbModel;
  }

  async showStoryDetailMap() {
    this.#view.showMapLoading();
    try {
      await this.#view.initialMap();
    } catch (error) {
      console.error('showStoryDetailMap: error:', error);
    } finally {
      this.#view.hideMapLoading();
    }
  }

  async showStoryDetail() {
    this.#view.showStoryDetailLoading();
    try {
      const response = await this.#apiModel.getDetail(this.#id);

      if (!response.ok) {
        console.error('showStoryDetailAndMap: response:', response);
        this.#view.populateStoryDetailError(response.message);
        return;
      }
      this.#view.populateStoryDetailAndInitialMap(response.story);
    } catch (error) {
      console.error('showStoryDetailAndMap: error:', error);
      this.#view.populateStoryDetailError(error.message);
    } finally {
      this.#view.hideStoryDetailLoading();
    }
  }

  async showSaveButton() {
    if (await this.#isStorySaved()) {
      this.#view.renderRemoveButton();
      return;
    }

    this.#view.renderSaveButton();
  }

  async saveStory() {
    try {
      const story = await this.#apiModel.getDetail(this.#id);
      console.log(story)
      await this.#dbModel.putStory(story.story);
      this.#view.saveToBookmarkSuccessfully('Success to save to bookmark');
    } catch (error) {
      console.error('saveReport: error:', error);
      this.#view.saveToBookmarkFailed(error.message);
    }
  }
 
  async removeStory() {
    try {
      await this.#dbModel.removeStory(this.#id);
      this.#view.removeFromBookmarkSuccessfully('Success to remove from bookmark');
    } catch (error) {
      console.error('removeReport: error:', error);
      this.#view.removeFromBookmarkFailed(error.message);
    }
  }

  async #isStorySaved() {
    return !!(await this.#dbModel.getStoryById(this.#id));
  }
}
