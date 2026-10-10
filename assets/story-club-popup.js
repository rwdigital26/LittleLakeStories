class StoryClubPopup extends HTMLElement {
  #timer;
  #listeners;
  #dialog;

  connectedCallback() {
    this.#dialog = this.querySelector('[data-popup-dialog]');
    if (!(this.#dialog instanceof HTMLDialogElement)) return;

    this.#listeners = new AbortController();
    const { signal } = this.#listeners;

    this.querySelector('[data-popup-close]')?.addEventListener('click', () => this.#dialog.close(), { signal });
    this.#dialog.addEventListener('click', (event) => {
      if (event.target === this.#dialog) this.#dialog.close();
    }, { signal });

    try {
      if (sessionStorage.getItem(this.dataset.storageKey) === 'shown') return;
    } catch {
      // Storage can be unavailable in privacy-restricted browsing modes.
    }

    const delay = Number.parseInt(this.dataset.delay ?? '3000', 10);
    this.#timer = window.setTimeout(() => {
      if (!this.isConnected || this.#dialog.open) return;
      this.#dialog.showModal();
      try {
        sessionStorage.setItem(this.dataset.storageKey, 'shown');
      } catch {
        // The popup still works when session storage is unavailable.
      }
    }, Number.isFinite(delay) ? delay : 3000);
  }

  disconnectedCallback() {
    window.clearTimeout(this.#timer);
    this.#listeners?.abort();
  }
}

if (!customElements.get('story-club-popup')) {
  customElements.define('story-club-popup', StoryClubPopup);
}