class CartUpsells extends HTMLElement {
  connectedCallback() {
    this.addEventListener('change', this.handleChange);
  }

  disconnectedCallback() {
    this.removeEventListener('change', this.handleChange);
  }

  handleChange = async (event) => {
    const checkbox = event.target.closest('[data-cart-upsell]');
    if (!checkbox) return;

    const shouldAdd = checkbox.checked;
    const previousState = !shouldAdd;
    const errorMessage = this.querySelector('[data-cart-upsell-error]');
    checkbox.disabled = true;
    errorMessage.hidden = true;

    try {
      const root = window.Shopify?.routes?.root || '/';
      const endpoint = shouldAdd ? `${root}cart/add.js` : `${root}cart/change.js`;
      const payload = shouldAdd
        ? { items: [{ id: Number(checkbox.dataset.variantId), quantity: 1 }] }
        : { id: checkbox.dataset.lineKey || checkbox.dataset.variantId, quantity: 0 };
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.description || result.message || 'We could not update this cart option.');
      }

      window.location.reload();
    } catch (error) {
      checkbox.checked = previousState;
      checkbox.disabled = false;
      errorMessage.textContent = error.message || 'We could not update this cart option. Please try again.';
      errorMessage.hidden = false;
    }
  };
}

if (!customElements.get('cart-upsells')) {
  customElements.define('cart-upsells', CartUpsells);
}