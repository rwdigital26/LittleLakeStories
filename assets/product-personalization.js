document.addEventListener('click', (event) => {
	const target = event.target;
	if (!(target instanceof Element)) return;

	const openTrigger = target.closest('[data-open-customizer]');
	if (openTrigger) {
		const customizer = openTrigger.closest('[data-product-personalization]');
		const dialog = customizer?.querySelector('[data-wizard-dialog]');

		if (dialog instanceof HTMLDialogElement && !dialog.open) {
			dialog.showModal();
		}
		return;
	}

	const closeTrigger = target.closest('[data-close-customizer]');
	if (closeTrigger) {
		const dialog = closeTrigger.closest('[data-wizard-dialog]');
		if (dialog instanceof HTMLDialogElement && dialog.open) dialog.close();
		return;
	}

	if (target instanceof HTMLDialogElement && target.matches('[data-wizard-dialog]') && target.open) {
		target.close();
	}
});
