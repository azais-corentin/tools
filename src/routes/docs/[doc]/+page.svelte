<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.title} · Docs · tools</title>
</svelte:head>

<article class="space-y-6">
	<a href="/docs" class="text-muted-foreground hover:text-foreground text-sm">← All documents</a>
	<div class="prose prose-neutral dark:prose-invert max-w-none">
		{@html data.html}
	</div>
</article>
