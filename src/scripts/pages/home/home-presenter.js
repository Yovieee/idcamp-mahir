export default class HomePresenter {
  constructor({ view, model }) {
    this._view = view;
    this._model = model;

    this._initialize();
  }

  async _initialize() {
    this._view.showLoading();
    try {
      const data = await this._model.getData();
      this._view.showData(data);
    } catch (error) {
      this._view.showError('Failed to load data');
    }
  }
}
