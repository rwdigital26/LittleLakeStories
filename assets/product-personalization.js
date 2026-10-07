const stepCount = 4;

function getSelectedGender(customizer) {
	return customizer.querySelector('[data-gender-option]:checked')?.value || 'Girl';
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
	const currentStep = Math.min(Math.max(step, 1), stepCount);
	customizer.dataset.currentStep = String(currentStep);

	for (const stepElement of customizer.querySelectorAll('[data-wizard-step]')) {
		stepElement.hidden = Number(stepElement.dataset.wizardStep) !== currentStep;
	}

	const indicator = customizer.querySelector('[data-step-indicator]');
	const backButton = customizer.querySelector('[data-wizard-back]');
	const nextButton = customizer.querySelector('[data-wizard-next]');
	if (indicator) indicator.textContent = `Step ${currentStep} of ${stepCount}`;
	if (backButton) backButton.hidden = currentStep === 1;
	if (nextButton) nextButton.textContent = currentStep === stepCount ? 'Add to Cart' : 'Next';

	if (currentStep === 1) {
		setGenderPreview(customizer, getSelectedGender(customizer));
	} else if (currentStep === 2) {
		updateHairChoices(customizer, getSelectedGender(customizer));
	} else if (currentStep === 4) {
		const preview = customizer.querySelector('[data-hair-preview]');
		const placeholder = customizer.querySelector('[data-hair-preview-placeholder]');
		const bookCover = customizer.querySelector('[data-book-cover-preview]');
		if (bookCover) {
			if (preview) preview.hidden = true;
			if (placeholder) placeholder.hidden = true;
			bookCover.hidden = false;
		}
	}

	customizer.querySelector(`[data-wizard-step="${currentStep}"] h3`)?.focus({ preventScroll: true });
}

function initializeCustomizer(customizer) {
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

	updateHairChoices(customizer, getSelectedGender(customizer));
	setStep(customizer, 1);
}

function validateCurrentStep(customizer, step) {
	if (step === 1) {
		const gender = customizer.querySelector('[data-gender-option]:checked');
		const firstName = customizer.querySelector('[name="properties[Child\'s First Name]"]');
		if (!gender) return customizer.querySelector('[data-gender-option]')?.reportValidity() ?? false;
		return firstName?.reportValidity() ?? true;
	}

	if (step === 2) {
		return Boolean(customizer.querySelector('[name="properties[Hair Style]"]')?.value);
	}

	return true;
}

function moveToNextStep(customizer) {
	const currentStep = Number(customizer.dataset.currentStep || 1);
	if (!validateCurrentStep(customizer, currentStep)) return;

	if (currentStep === stepCount) {
		const productForm = document.getElementById(customizer.dataset.productFormId);
		productForm?.requestSubmit();
		return;
	}

	setStep(customizer, currentStep + 1);
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

	const hairChoice = target.closest('[data-hair-choice]');
	if (hairChoice instanceof HTMLButtonElement) {
		selectHairChoice(customizer, hairChoice);
		return;
	}

	const backButton = target.closest('[data-wizard-back]');
	if (backButton) {
		setStep(customizer, Number(customizer.dataset.currentStep || 1) - 1);
		return;
	}

	if (target.closest('[data-wizard-next]')) {
		moveToNextStep(customizer);
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

	if (target.matches('[data-gender-option]')) {
		setGenderPreview(customizer, target.value);
		updateHairChoices(customizer, target.value);
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
