export default class CreatePresenter {
  #view;
  #model;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  async showNewFormMap() {
    this.#view.showMapLoading();
    try {
      await this.#view.initialMap();
    } catch (error) {
      console.error('showNewFormMap: error:', error);
    } finally {
      this.#view.hideMapLoading();
    }
  }

  async postNewStory({ description, photo, lat, lon }) {
    this.#view.showSubmitLoadingButton();
    try {
      const data = {
        description: description,
        photo: photo,
        lat: lat,
        lon: lon,
      };
      const response = await this.#model.createStory(data);

      if (!response.ok) {
        console.error('postNewStory: response:', response);
        this.#view.storeFailed(response.message);
        return;
      }
      this.#notifyToAllUser(response.data.id);

      this.#view.storeSuccessfully(response.message);
    } catch (error) {
      console.error('postNewStory: error:', error);
      this.#view.storeFailed(error.message);
    } finally {
      this.#view.hideSubmitLoadingButton();
    }
  }
 
  async #notifyToAllUser(reportId) {
    try {
      const response = await this.#model.sendReportToAllUserViaNotification(reportId);
      if (!response.ok) {
        console.error('#notifyToAllUser: response:', response);
        return false;
      }
      return true;
    } catch (error) {
      console.error('#notifyToAllUser: error:', error);
      return false;
    }
  }
}
