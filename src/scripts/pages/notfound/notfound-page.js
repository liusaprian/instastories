export default class NotFound {

  async render() {
    return `
      <section class="container">
        <div class="not-found__container">
          <h2>404 - Halaman Tidak Ditemukan</h2>
          <p>Oops! Halaman ini tidak ada.</p>
          <a id="back-home-button" class="btn back-home-button" href="#/">Kembali ke Halaman Utama</i></a>
        </div>
      </section>
    `;
  }

  async afterRender() {
  }

}