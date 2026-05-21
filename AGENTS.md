# Project rules

Conventions every agent (and human) must follow when extending this site.

## Stack

SvelteKit (runes mode, Svelte 5) + Tailwind v4 + shadcn-svelte (nova style,
neutral base, lucide icons) + Bun. Static-only via `adapter-static`; every route
prerenders.

## Styling

**ALWAYS use shadcn-svelte for UI primitives and styling.** No hand-rolled
buttons, inputs, cards, dialogs, etc. If a primitive is missing, add it via the
CLI — never copy/paste markup from elsewhere.

## Adding shadcn components

Use the CLI, never edit `components.json` or hand-author component files.

```sh
bun x shadcn-svelte@latest add -y -o button
bun x shadcn-svelte@latest add -y -o input card
```

The `-y` flag auto-confirms, `-o` overwrites any local edits so the registry
stays the source of truth.

## Adding a new tool

1. Create `src/routes/<slug>/+page.svelte` and `src/routes/<slug>/meta.ts`
   (export `meta: Tool`).
2. Add a static import line in `src/lib/tools.ts` so the index picks it up.
3. Keep each tool self-contained — colocate helpers in the tool's folder, not
   under `src/lib/` unless genuinely shared.
4. The tool MUST work fully client-side (static site, no server runtime).

## Routing / prerender

Every route is prerendered. Do not add `+page.server.ts`, hooks, or anything
requiring a Node runtime. Avoid `onMount`-only patterns where the page would
render blank during prerender — render meaningful HTML, then hydrate.

## Commits

Conventional Commits (`feat:`, `fix:`, `chore:`, `ci:`, `docs:`). One logical
change per commit.

## Verification before commit

`bun run check` MUST pass; for build-affecting changes also `bun run build`.

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds with Bun
and deploys via `actions/deploy-pages`. Do not edit Pages settings in the
GitHub UI — the workflow is the source of truth.

## Dependencies

Managed with Bun (`bun add`, `bun add -d`). Do not commit `node_modules`;
lockfile is `bun.lock`.
