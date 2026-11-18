// Enforced for marked modules by scripts/vpn-context-loader.cjs.
export const isInBackground = () =>
	typeof window === 'undefined' ||
	window.location.href.includes('_generated_background_page.html');
