import { StandardEvents } from '@shopify/events';

class ProductPersonalization extends HTMLElement {
  connectedCallback() {
    this.dialog = this.querySelector('[data-wizard-dialog]');
    this.currentStep = 1;

    this.querySelector('[data-open-customizer]')?.addEventListener('click', () => this.dialog.showModal());
    this.querySelector('[data-close-customizer]')?.addEventListener('click', () => this.dialog.close());
    this.dialog.addEventListener('click', (event) => {
      if (event.target === this.dialog) this.dialog.close();
    });
    this.dialog.addEventListener('close', () => this.querySelector('[data-open-customizer]')?.focus());
    this.querySelector('[data-wizard-next]')?.addEventListener('click', () => this.changeStep(1));
    this.querySelector('[data-wizard-back]')?.addEventListener('click', () => this.changeStep(-1));
    this.querySelector('[data-style-previous]')?.addEventListener('click', () => this.changeHairStyle(-1));
    this.querySelector('[data-style-next]')?.addEventListener('click', () => this.changeHairStyle(1));
    this.querySelectorAll('[data-cover-choice]').forEach((choice) => {
      choice.addEventListener('click', (event) => {
        event.preventDefault();
        this.addCoverToCart(choice.dataset.coverChoice);
      });
    });

    this.messageInput = this.querySelector('[data-message-input]');
    this.messageCount = this.querySelector('[data-message-count]');
    this.messageInput?.addEventListener('input', () => {
      this.messageCount.textContent = this.messageInput.value.length;
    });

    this.cartUpdateListener = (event) => {
      const productForm = event.target.closest?.('product-form-component');
      if (event.action !== 'add' || productForm?.dataset.productId !== this.dataset.productId) return;

      event.promise?.then(
        ({ detail }) => {
          if (!detail?.didError && this.dialog.open) this.dialog.close();
        },
        () => {}
      );
    };
    document.addEventListener(StandardEvents.cartLinesUpdate, this.cartUpdateListener);

    this.ranges = this.querySelectorAll('[data-personalization-range]');
    this.ranges.forEach((range) => {
      range.addEventListener('input', () => this.updateRange(range));
      if (!range.classList.contains('product-personalization__range--style')) {
        this.updateRange(range);
      }
    });

    this.querySelectorAll('[data-gender-option]').forEach((option) => {
      option.addEventListener('change', () => this.updateHairStyles());
    });

    this.querySelectorAll('[data-hair-choice]').forEach((choice) => {
      choice.addEventListener('click', () => {
        const styleRange = this.querySelector('.product-personalization__range--style');
        styleRange.value = this.getVisibleHairChoices().indexOf(choice);
        styleRange.dispatchEvent(new Event('input', { bubbles: true }));
      });
    });

    this.updateHairStyles();
  }

  disconnectedCallback() {
    document.removeEventListener(StandardEvents.cartLinesUpdate, this.cartUpdateListener);
  }

  changeStep(direction) {
    if (direction > 0) {
      const activeStep = this.querySelector(`[data-wizard-step="${this.currentStep}"]`);
      const invalidField = [...activeStep.querySelectorAll('input, textarea, select')].find(
        (field) => !field.disabled && !field.checkValidity()
      );

      if (invalidField) {
        invalidField.reportValidity();
        invalidField.focus();
        return;
      }
    }

    this.currentStep = Math.min(4, Math.max(1, this.currentStep + direction));
    this.querySelectorAll('[data-wizard-step]').forEach((step) => {
      step.hidden = Number(step.dataset.wizardStep) !== this.currentStep;
    });
    this.querySelector('[data-step-indicator]').textContent = `Step ${this.currentStep} of 4`;
    this.querySelector('[data-wizard-back]').hidden = this.currentStep === 1;
    this.querySelector('[data-wizard-next]').hidden = this.currentStep === 4;
    const coverPreview = this.querySelector('[data-book-cover-preview]');
    const hairPreview = this.querySelector('[data-hair-preview]');
    if (coverPreview) coverPreview.hidden = this.currentStep !== 4;
    if (hairPreview.hasAttribute('src')) hairPreview.hidden = this.currentStep === 4;
    this.querySelector('[data-hair-preview-placeholder]').hidden = this.currentStep === 4 || hairPreview.hasAttribute('src');
    this.querySelector(`[data-wizard-step="${this.currentStep}"] h3`)?.focus();
  }

  changeHairStyle(direction) {
    const range = this.querySelector('.product-personalization__range--style');
    range.value = String(Math.min(Number(range.max), Math.max(0, Number(range.value) + direction)));
    range.dispatchEvent(new Event('input', { bubbles: true }));
  }

  async addCoverToCart(coverType) {
    const form = document.getElementById(this.dataset.productFormId);
    const buttons = this.querySelectorAll('[data-cover-choice]');
    const error = this.querySelector('[data-cover-error]');

    if (!form || !form.reportValidity()) return;

    buttons.forEach((button) => {
      button.disabled = true;
    });
    error.hidden = true;

    const formData = new FormData(form);
    const properties = {};
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('properties[')) {
        properties[key.slice('properties['.length, -1)] = value;
      }
    }
    properties['Cover Type'] = coverType;

    const items = [
      {
        id: Number(formData.get('id')),
        quantity: Number(formData.get('quantity')) || 1,
        properties,
      },
    ];

    if (coverType === 'Hard Cover') {
      items.push({
        id: Number(this.dataset.hardcoverAddonVariantId),
        quantity: Number(formData.get('quantity')) || 1,
      });
    }

    try {
      const root = window.Shopify?.routes?.root || '/';
      const response = await fetch(`${root}cart/add.js`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ items }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.description || result.message || 'We could not add this book to your cart.');
      }

      window.location.assign(`${root}cart`);
    } catch (requestError) {
      error.textContent = requestError.message || 'We could not add this book to your cart. Please try again.';
      error.hidden = false;
      buttons.forEach((button) => {
        button.disabled = false;
      });
    }
  }

  getVisibleHairChoices() {
    return [...this.querySelectorAll('[data-hair-choice]')].filter((choice) => !choice.hidden);
  }

  updateHairStyles() {
    const gender = this.querySelector('[data-gender-option]:checked')?.value;
    const choices = [...this.querySelectorAll('[data-hair-choice]')];
    const visibleChoices = choices.filter((choice) => gender && (choice.dataset.hairGender === gender || choice.dataset.hairGender === 'Both'));
    const styleRange = this.querySelector('.product-personalization__range--style');
    const field = styleRange.closest('.product-personalization__field');
    const output = field.querySelector('[data-range-output]');
    const property = field.querySelector('[data-range-property]');

    choices.forEach((choice) => {
      choice.hidden = !visibleChoices.includes(choice);
      choice.classList.remove('is-selected');
      choice.setAttribute('aria-pressed', 'false');
    });

    styleRange.disabled = visibleChoices.length === 0;
    styleRange.max = String(Math.max(visibleChoices.length - 1, 0));
    styleRange.value = '0';

    if (visibleChoices.length > 0) {
      this.updateRange(styleRange);
    } else {
      output.value = 'Choose Girl or Boy to view styles';
      output.textContent = output.value;
      property.value = '';
    }
  }

  updateRange(range) {
    const index = Number(range.value);
    const field = range.closest('.product-personalization__field');
    const output = field.querySelector('[data-range-output]');
    const property = field.querySelector('[data-range-property]');

    if (range.classList.contains('product-personalization__range--style')) {
      const visibleChoices = this.getVisibleHairChoices();
      const selectedChoice = visibleChoices[index];
      if (!selectedChoice) return;

      const value = selectedChoice.dataset.hairStyle;
      output.value = value;
      output.textContent = value;
      property.value = value;
      const preview = this.querySelector('[data-hair-preview]');
      preview.src = selectedChoice.dataset.hairImage;
      preview.alt = `${value} character preview`;
      preview.hidden = false;
      this.querySelector('[data-hair-preview-placeholder]').hidden = true;
      if (!this.querySelector('[data-wizard-step="2"]').hidden) {
        selectedChoice.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
      }

      this.querySelectorAll('[data-hair-choice]').forEach((choice) => {
        const selected = choice === selectedChoice;
        choice.classList.toggle('is-selected', selected);
        choice.setAttribute('aria-pressed', String(selected));
      });
      return;
    }

    const values = range.dataset.rangeValues.split('|');
    const value = values[index];
    output.value = value;
    output.textContent = value;
    property.value = value;

    if (range.dataset.rangeColors) {
      const colors = range.dataset.rangeColors.split('|');
      const color = colors[index];
      if (range.classList.contains('product-personalization__range--skin')) {
        this.style.setProperty('--personalization-skin-color', color);
      } else if (range.classList.contains('product-personalization__range--eye')) {
        this.style.setProperty('--personalization-eye-color', color);
        range.style.setProperty('--personalization-thumb-color', color);
      } else {
        this.style.setProperty('--personalization-hair-color', color);
        range.style.setProperty('--personalization-thumb-color', color);
      }
    }
  }

}

if (!customElements.get('product-personalization-component')) {
  customElements.define('product-personalization-component', ProductPersonalization);
}