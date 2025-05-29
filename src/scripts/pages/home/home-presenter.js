export default class HomePresenter {
  #view;
  #model;
  #currentPageSize;
  #page = 1;
  #size = 9;
  #location = 1;

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

  async initialStoriesAndMap(nextResponse = null) {
    this.#view.showLoading();
    try {
      if(!this.#view.isMapInitialized()) await this.showStoryListMap();
      let response = null;
      if(nextResponse == null) response = await this.#model.getAllStories({page: this.#page, size: this.#size, location: this.#location});
      else response = nextResponse;

      if (!response.ok) {
        console.error('initialStoriesAndMap: response:', response);
        this.#view.populateStoryListError(response.message);
        return;
      }
      this.#currentPageSize = response.listStory.length;
      this.#view.populateStoryList(response.listStory);
    } catch (error) {
      console.error('initialStoriesAndMap: error:', error);
      this.#view.populateStoryListError(error.message);
    } finally {
      this.#view.hideLoading();
    }
  }

  async handlePagination() {
    let nextResponse = null;
    let next = false;
    const paginationContainer = document.createElement('div');
    paginationContainer.classList.add('pagination');
    
    const previousBtn = document.createElement('btn');
    previousBtn.textContent = '<';
    previousBtn.addEventListener('click', async(event) => {
      event.preventDefault();
      paginationContainer.textContent = ''
      this.#page--;
      this.initialStoriesAndMap();
    });
    
    const nextBtn = document.createElement('btn');
    nextBtn.textContent = '>';
    nextBtn.addEventListener('click', async(event) => {
      event.preventDefault();
      paginationContainer.textContent = ''
      this.#page++;
      this.initialStoriesAndMap(nextResponse);
    });

    const pageCounter = document.createElement('p');
    pageCounter.textContent = this.#page;

    if(this.#page > 1) paginationContainer.appendChild(previousBtn);
    if(this.#currentPageSize == this.#size) {
      let nextPageSize = 0;
      try {
        nextResponse = await this.#model.getAllStories({page: this.#page+1, size: this.#size, location: this.#location});
        nextPageSize = nextResponse.listStory.length;
      } catch (error) {
        console.error('nextPageSize: error:', error);
      } finally {
        if(nextPageSize > 0) next = true;
      }
    }
    paginationContainer.appendChild(pageCounter);
    if(next) paginationContainer.appendChild(nextBtn);

    document.getElementById('story-list__container').appendChild(paginationContainer)
    window.scrollTo(0, 0);
  }
}
