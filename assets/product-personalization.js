function getStepCount(customizer) {
	return Number(customizer.dataset.wizardSteps) || 4;
}

function clearStepValidationError(customizer) {
	const error = customizer.querySelector('[data-step-error]');
	if (!error) return;

	error.hidden = true;
	error.textContent = '';
}

function getSelectedGender(customizer) {
	if (customizer.dataset.subscriptionFlow === 'true') {
		const ageGroup = customizer.querySelector('[data-age-group]:checked')?.value;
		if (ageGroup === 'Boy 1-8') return 'Boy';
		if (ageGroup === 'Girl 1-8') return 'Girl';
		return customizer.querySelector('[data-gender-option]:checked')?.value || 'Girl';
	}

	return customizer.querySelector('[data-gender-option]:checked')?.value || 'Girl';
}

function updateBabyGenderGroup(customizer, ageGroup) {
	if (customizer.dataset.subscriptionFlow !== 'true') return;

	const group = customizer.querySelector('[data-baby-gender-group]');
	if (!group) return;

	const showGender = ageGroup === 'Baby 0-1';
	group.hidden = !showGender;
	for (const option of group.querySelectorAll('[data-gender-option]')) {
		option.disabled = !showGender;
		option.required = false;
		if (!showGender) option.checked = false;
	}
}

function setPreviewImage(customizer, source, alt) {
	const preview = customizer.querySelector('[data-hair-preview]');
	const placeholder = customizer.querySelector('[data-hair-preview-placeholder]');
	const bookCover = customizer.querySelector('[data-book-cover-preview]');

	if (!preview || !source) return;

	preview.src = source;
	preview.alt = alt;
	preview.hidden = false;
	placeholder?.setAttribute('hidden', '');
	if (bookCover) bookCover.hidden = true;
}

function setGenderPreview(customizer, gender) {
	const source = gender === 'Boy' ? customizer.dataset.boyPreviewImage : customizer.dataset.girlPreviewImage;
	setPreviewImage(customizer, source, `${gender} character preview`);
}

function setBookCoverPreview(customizer) {
	const preview = customizer.querySelector('[data-hair-preview]');
	const placeholder = customizer.querySelector('[data-hair-preview-placeholder]');
	const bookCover = customizer.querySelector('[data-book-cover-preview]');

	if (preview) preview.hidden = true;
	if (placeholder) placeholder.hidden = true;
	if (bookCover) bookCover.hidden = false;
}

function updateRangeProperty(range) {
	const values = (range.dataset.rangeValues || '').split('|');
	const selectedIndex = Number(range.value);
	const selectedValue = values[selectedIndex] || range.value;
	const outputId = range.getAttribute('aria-describedby');
	const output = outputId ? document.getElementById(outputId) : null;
	const property = range.closest('.product-personalization__field')?.querySelector('[data-range-property]');

	if (output) output.value = selectedValue;
	if (property) property.value = selectedValue;
}

function getAvailableHairChoices(customizer) {
	return [...customizer.querySelectorAll('[data-hair-choice]')].filter((choice) => !choice.hidden);
}

function selectHairChoice(customizer, choice) {
	if (!choice) return;

	const choices = [...customizer.querySelectorAll('[data-hair-choice]')];
	for (const option of choices) {
		option.setAttribute('aria-pressed', String(option === choice));
	}

	const availableChoices = getAvailableHairChoices(customizer);
	const choiceIndex = availableChoices.indexOf(choice);
	const styleRange = customizer.querySelector('.product-personalization__range--style');
	const styleProperty = customizer.querySelector('[name="properties[Hair Style]"]');
	const styleOutputId = styleRange?.getAttribute('aria-describedby');
	const styleOutput = styleOutputId ? document.getElementById(styleOutputId) : null;

	if (styleRange) {
		styleRange.disabled = availableChoices.length === 0;
		styleRange.max = String(Math.max(availableChoices.length - 1, 0));
		styleRange.value = String(Math.max(choiceIndex, 0));
	}
	if (styleProperty) styleProperty.value = choice.dataset.hairStyle || '';
	if (styleOutput) styleOutput.value = choice.dataset.hairStyle || '';

	setPreviewImage(customizer, choice.dataset.hairImage, `${getSelectedGender(customizer)} character preview`);
}

function updateHairChoices(customizer, gender) {
	const choices = [...customizer.querySelectorAll('[data-hair-choice]')];

	for (const choice of choices) {
		choice.hidden = choice.dataset.hairGender !== gender && choice.dataset.hairGender !== 'Both';
	}

	const availableChoices = getAvailableHairChoices(customizer);
	availableChoices.forEach((choice, index) => {
		const thumbnail = choice.querySelector('img');
		if (thumbnail) thumbnail.loading = index < 4 ? 'eager' : 'lazy';
	});
	const selectedChoice = availableChoices.find((choice) => choice.getAttribute('aria-pressed') === 'true');

	if (availableChoices.length > 0) {
		selectHairChoice(customizer, selectedChoice || availableChoices[0]);
	} else {
		const styleRange = customizer.querySelector('.product-personalization__range--style');
		const styleProperty = customizer.querySelector('[name="properties[Hair Style]"]');
		if (styleRange) styleRange.disabled = true;
		if (styleProperty) styleProperty.value = '';
		setGenderPreview(customizer, gender);
	}
}

function setStep(customizer, step) {
	const stepCount = getStepCount(customizer);
	const currentStep = Math.min(Math.max(step, 1), stepCount);
	customizer.dataset.currentStep = String(currentStep);
	clearStepValidationError(customizer);

	for (const stepElement of customizer.querySelectorAll('[data-wizard-step]')) {
		stepElement.hidden = Number(stepElement.dataset.wizardStep) !== currentStep;
	}

	const indicator = customizer.querySelector('[data-step-indicator]');
	const backButton = customizer.querySelector('[data-wizard-back]');
	const nextButton = customizer.querySelector('[data-wizard-next]');
	if (indicator) indicator.textContent = `Step ${currentStep} of ${stepCount}`;
	if (backButton) backButton.hidden = currentStep === 1;
	if (nextButton) nextButton.textContent = currentStep === stepCount ? 'Add to Cart' : 'Next';

	if (customizer.dataset.customFlow === 'true') {
		setBookCoverPreview(customizer);
	} else if (customizer.dataset.subscriptionFlow === 'true') {
		updateBabyGenderGroup(customizer, customizer.querySelector('[data-age-group]:checked')?.value);
		if (currentStep === 2) {
			updateHairChoices(customizer, getSelectedGender(customizer));
		} else if (currentStep === 4) {
			setBookCoverPreview(customizer);
		} else {
			setGenderPreview(customizer, getSelectedGender(customizer));
		}
	} else if (currentStep === 1) {
		setGenderPreview(customizer, getSelectedGender(customizer));
	} else if (currentStep === 2) {
		updateHairChoices(customizer, getSelectedGender(customizer));
	} else if (currentStep === Number(customizer.dataset.coverStep || 4)) {
		setBookCoverPreview(customizer);
	}

	customizer.querySelector(`[data-wizard-step="${currentStep}"] h3`)?.focus({ preventScroll: true });
}

function initializeCustomizer(customizer) {
	bindWizardNavigation(customizer);
	if (customizer.dataset.personalizationInitialized === 'true') return;
	customizer.dataset.personalizationInitialized = 'true';

	for (const range of customizer.querySelectorAll('[data-personalization-range]')) {
		updateRangeProperty(range);
	}

	const message = customizer.querySelector('[data-message-input]');
	const messageCount = customizer.querySelector('[data-message-count]');
	if (message && messageCount) messageCount.textContent = String(message.value.length);

	const softCoverChoice = customizer.querySelector('[data-cover-choice="Soft Cover"]');
	if (softCoverChoice) softCoverChoice.setAttribute('aria-pressed', 'true');

	if (customizer.dataset.customFlow === 'true') {
		setBookCoverPreview(customizer);
	} else if (customizer.dataset.subscriptionFlow === 'true') {
		updateBabyGenderGroup(customizer, customizer.querySelector('[data-age-group]:checked')?.value);
		setGenderPreview(customizer, getSelectedGender(customizer));
	} else {
		updateHairChoices(customizer, getSelectedGender(customizer));
	}
	setStep(customizer, 1);
}

function validateCurrentStep(customizer, step) {
	if (customizer.dataset.customFlow === 'true') {
		return true;
	}

	if (customizer.dataset.subscriptionFlow === 'true') {
		if (step === 1) return true;

		if (step === 2) {
			return Boolean(customizer.querySelector('[name="properties[Hair Style]"]')?.value);
		}

		if (step === 3) {
			for (const field of customizer.querySelectorAll('[data-wizard-step="3"] select[required]')) {
				if (!field.reportValidity()) return false;
			}
		}
		return true;
	}

	if (step === 1) return true;

	if (step === 2) {
		return Boolean(customizer.querySelector('[name="properties[Hair Style]"]')?.value);
	}

	return true;
}

function getStepValidationMessage(customizer, step) {
	if (customizer.dataset.customFlow === 'true' && step === 1) {
		return 'Check the acknowledgement before continuing.';
	}

	if (customizer.dataset.subscriptionFlow === 'true') {
		if (step === 2) return 'Choose a hairstyle to continue.';
		if (step === 3) return 'Complete the birthday details to continue.';
	}

	if (step === 1) {
		if (!customizer.querySelector('[data-gender-option]:checked')) return 'Choose Girl or Boy to continue.';
		return 'Enter the child’s first name to continue.';
	}
	if (step === 2) return 'Choose a hairstyle to continue.';
	return 'Complete the required information to continue.';
}

function getInvalidRequiredField(customizer) {
	return [...customizer.querySelectorAll('input[required], select[required], textarea[required]')].find(
		field => !field.disabled && !field.checkValidity()
	);
}

function showCartError(customizer, message) {
	const error = customizer.querySelector('[data-cover-error]');
	if (!error) return;

	error.textContent = message || 'We could not add this to your cart. Please try again.';
	error.hidden = false;
}

function resetAddToCartButton(button) {
	if (!button) return;

	button.disabled = false;
	button.removeAttribute('aria-busy');
	button.textContent = 'Add to Cart';
}

function submitPersonalization(customizer) {
	const productForm = document.getElementById(customizer.dataset.productFormId);
	const productFormComponent = productForm?.closest('product-form-component');
	const addButton = customizer.querySelector('[data-wizard-next]');
	const error = customizer.querySelector('[data-cover-error]');

	if (!productForm || !productFormComponent) {
		showCartError(customizer);
		return;
	}

	const invalidField = getInvalidRequiredField(customizer);
	if (invalidField) {
		const invalidStep = Number(invalidField.closest('[data-wizard-step]')?.dataset.wizardStep || 1);
		setStep(customizer, invalidStep);
		const stepError = customizer.querySelector('[data-step-error]');
		if (stepError) {
			stepError.textContent = getStepValidationMessage(customizer, invalidStep);
			stepError.hidden = false;
		}
		invalidField.reportValidity();
		return;
	}

	if (!productForm.reportValidity()) return;

	if (error) {
		error.hidden = true;
		error.textContent = '';
	}
	if (addButton) {
		addButton.disabled = true;
		addButton.setAttribute('aria-busy', 'true');
		addButton.textContent = 'Adding...';
	}

	productFormComponent.addEventListener('shopify:cart:lines-update', (event) => {
		if (!event.promise) {
			showCartError(customizer);
			resetAddToCartButton(addButton);
			return;
		}

		event.promise
			.then(({ detail }) => {
				if (detail?.didError) {
					const formError = productFormComponent.querySelector('.product-form-text__error')?.textContent?.trim();
					showCartError(customizer, formError);
					return;
				}

			window.location.assign(Theme.routes.cart_url);
			})
			.catch((requestError) => {
				showCartError(customizer, requestError?.message);
			})
			.finally(() => resetAddToCartButton(addButton));
	}, { once: true });

	productForm.requestSubmit();
}

function moveToNextStep(customizer) {
	const currentStep = Number(customizer.dataset.currentStep || 1);
	const stepCount = getStepCount(customizer);
	if (!validateCurrentStep(customizer, currentStep)) {
		const error = customizer.querySelector('[data-step-error]');
		if (error) {
			error.textContent = getStepValidationMessage(customizer, currentStep);
			error.hidden = false;
		}
		return;
	}
	clearStepValidationError(customizer);

	if (currentStep === stepCount) {
		submitPersonalization(customizer);
		return;
	}

	setStep(customizer, currentStep + 1);
}

function bindWizardNavigation(customizer) {
	if (customizer.dataset.wizardNavigationBound === 'true') return;
	customizer.dataset.wizardNavigationBound = 'true';

	const backButton = customizer.querySelector('[data-wizard-back]');
	const nextButton = customizer.querySelector('[data-wizard-next]');

	backButton?.addEventListener('click', (event) => {
		event.preventDefault();
		event.stopPropagation();
		setStep(customizer, Number(customizer.dataset.currentStep || 1) - 1);
	});

	nextButton?.addEventListener('click', (event) => {
		event.preventDefault();
		event.stopPropagation();
		moveToNextStep(customizer);
	});
}

document.addEventListener('click', (event) => {
	const target = event.target;
	if (!(target instanceof Element)) return;

	const openTrigger = target.closest('[data-open-customizer]');
	if (openTrigger) {
		const customizer = openTrigger.closest('[data-product-personalization]');
		const dialog = customizer?.querySelector('[data-wizard-dialog]');

		if (customizer) initializeCustomizer(customizer);
		if (dialog instanceof HTMLDialogElement && !dialog.open) dialog.showModal();
		if (customizer) setStep(customizer, 1);
		return;
	}

	const closeTrigger = target.closest('[data-close-customizer]');
	if (closeTrigger) {
		const dialog = closeTrigger.closest('[data-wizard-dialog]');
		if (dialog instanceof HTMLDialogElement && dialog.open) dialog.close();
		return;
	}

	const customizer = target.closest('[data-product-personalization]');
	if (!customizer) return;

	if (target instanceof HTMLDialogElement && target.matches('[data-wizard-dialog]') && target.open) {
		target.close();
		return;
	}

	const genderOption = target.closest('[data-gender-option]');
	if (genderOption instanceof HTMLInputElement) {
		setGenderPreview(customizer, genderOption.value);
		updateHairChoices(customizer, genderOption.value);
		return;
	}

	const ageGroup = target.closest('[data-age-group]');
	if (ageGroup instanceof HTMLInputElement) {
		updateBabyGenderGroup(customizer, ageGroup.value);
		if (Number(customizer.dataset.currentStep) === 2) {
			updateHairChoices(customizer, getSelectedGender(customizer));
		} else {
			setGenderPreview(customizer, getSelectedGender(customizer));
		}
		return;
	}

	const hairChoice = target.closest('[data-hair-choice]');
	if (hairChoice instanceof HTMLButtonElement) {
		selectHairChoice(customizer, hairChoice);
		return;
	}

	const coverChoice = target.closest('[data-cover-choice]');
	if (coverChoice instanceof HTMLButtonElement) {
		const coverProperty = customizer.querySelector('[data-cover-property]');
		if (coverProperty) coverProperty.value = coverChoice.dataset.coverChoice || 'Soft Cover';
		for (const choice of customizer.querySelectorAll('[data-cover-choice]')) {
			choice.setAttribute('aria-pressed', String(choice === coverChoice));
		}
		const coverError = customizer.querySelector('[data-cover-error]');
		if (coverError) coverError.hidden = true;
		return;
	}

	const carouselButton = target.closest('[data-style-previous], [data-style-next]');
	if (carouselButton instanceof HTMLButtonElement) {
		const options = customizer.querySelector('.product-personalization__style-options');
		if (options) {
			const direction = carouselButton.matches('[data-style-next]') ? 1 : -1;
			options.scrollBy({ left: direction * options.clientWidth * 0.75, behavior: 'smooth' });
		}
	}
});

document.addEventListener('change', (event) => {
	const target = event.target;
	if (!(target instanceof HTMLInputElement)) return;

	const customizer = target.closest('[data-product-personalization]');
	if (!customizer) return;
	clearStepValidationError(customizer);

	if (target.matches('[data-gender-option]')) {
		setGenderPreview(customizer, target.value);
		updateHairChoices(customizer, target.value);
	} else if (target.matches('[data-age-group]')) {
		updateBabyGenderGroup(customizer, target.value);
		if (Number(customizer.dataset.currentStep) === 2) {
			updateHairChoices(customizer, getSelectedGender(customizer));
		} else {
			setGenderPreview(customizer, getSelectedGender(customizer));
		}
	} else if (target.matches('[data-personalization-range]')) {
		if (target.matches('.product-personalization__range--style')) {
			const availableChoices = getAvailableHairChoices(customizer);
			const selectedChoice = availableChoices[Number(target.value)];
			if (selectedChoice) selectHairChoice(customizer, selectedChoice);
		} else {
			updateRangeProperty(target);
		}
	}
});

document.addEventListener('input', (event) => {
	const target = event.target;
	if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;

	const customizer = target.closest('[data-product-personalization]');
	if (!customizer) return;
	clearStepValidationError(customizer);

	if (target.matches('[data-personalization-range]')) {
		if (target.matches('.product-personalization__range--style')) {
			const availableChoices = getAvailableHairChoices(customizer);
			const selectedChoice = availableChoices[Number(target.value)];
			if (selectedChoice) selectHairChoice(customizer, selectedChoice);
		} else {
			updateRangeProperty(target);
		}
	}

	if (target.matches('[data-message-input]')) {
		const messageCount = customizer.querySelector('[data-message-count]');
		if (messageCount) messageCount.textContent = String(target.value.length);
	}
});
