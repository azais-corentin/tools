/**
 * Rasterize an SVG string to a PNG `Blob` via an offscreen canvas.
 *
 * Browser-only: relies on `Image`, `URL.createObjectURL`, and `<canvas>`. Call it
 * from event handlers, never at module load or during prerender. etiket SVGs always
 * carry explicit `width`/`height`, so the image resolves intrinsic dimensions.
 *
 * @param scale Target upscale factor; clamped so the longest side stays <= 4096px.
 */
export async function svgToPng(svg: string, scale = 3): Promise<Blob> {
	const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
	const objUrl = URL.createObjectURL(blob);
	try {
		const img = new Image();
		await new Promise<void>((resolve, reject) => {
			img.onload = () => resolve();
			img.onerror = () => reject(new Error('Failed to rasterize SVG'));
			img.src = objUrl;
		});

		const w = img.naturalWidth || img.width || 256;
		const h = img.naturalHeight || img.height || 256;
		const k = Math.max(1, Math.min(scale, Math.floor(4096 / Math.max(w, h)) || 1));

		const canvas = document.createElement('canvas');
		canvas.width = Math.max(1, Math.round(w * k));
		canvas.height = Math.max(1, Math.round(h * k));

		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('Canvas 2D context unavailable');
		ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

		return await new Promise<Blob>((resolve, reject) =>
			canvas.toBlob(
				(b) => (b ? resolve(b) : reject(new Error('toBlob returned null'))),
				'image/png'
			)
		);
	} finally {
		URL.revokeObjectURL(objUrl);
	}
}
