import type { Tool } from './types';

/**
 * Static registry of every tool on the site.
 *
 * Adding a new tool:
 *   1. Create `src/routes/<slug>/+page.svelte` and `src/routes/<slug>/meta.ts`
 *      (export `meta: Tool`).
 *   2. Add a static `import { meta as <name> } from '../routes/<slug>/meta';`
 *      below and append it to the `metas` array.
 *
 * Static imports (not `import.meta.glob`) keep this typed, tree-shaken, and
 * predictable under prerender.
 */

const metas: Tool[] = [];

/** All tools, sorted newest-first then alphabetically. */
export const tools: readonly Tool[] = [...metas].sort((a, b) => {
	const da = a.added ?? '';
	const db = b.added ?? '';
	if (da !== db) return db.localeCompare(da);
	return a.title.localeCompare(b.title);
});
