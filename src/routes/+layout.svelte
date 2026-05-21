<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import SiteHeader from '$lib/components/site-header.svelte';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="bg-background text-foreground min-h-screen">
	<SiteHeader />
	<main class="mx-auto max-w-5xl px-4 py-8">
		{@render children()}
	</main>
</div>
