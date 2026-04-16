import AboutPresenter from './about-presenter';

export default class AboutPage {
  async render() {
    return `
      <section class="container">
        <h1 class="page-title">About Page</h1>
        <article class="card">
          <p>This application was built with a modern MVP architecture and features smooth view transitions using the experimental View Transition API.</p>
          <p>Built as part of the Dicoding Front-End Web Developer Expert course.</p>
        </article>
      </section>
    `;
  }

  async afterRender() {
    new AboutPresenter({
      view: this,
    });
  }
}
