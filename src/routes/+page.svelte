<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from '$lib/components/ui/card';
	import { tools } from '$lib/tools';
	import type { Tool } from '$lib/types';

	let query = $state('');

	function matches(tool: Tool, raw: string): boolean {
		const terms = raw.toLowerCase().split(/\s+/).filter(Boolean);
		if (terms.length === 0) return true;
		const haystack = [tool.title, tool.description, ...(tool.tags ?? [])]
			.join(' ')
			.toLowerCase();
		return terms.every((t) => haystack.includes(t));
	}

	const filtered = $derived(tools.filter((t) => matches(t, query)));
</script>

<svelte:head>
	<title>tools</title>
	<meta name="description" content="A small catalog of single-page tools." />
</svelte:head>

<section class="space-y-6">
	<div class="space-y-2">
		<h1 class="text-2xl font-semibold tracking-tight">tools</h1>
		<p class="text-muted-foreground text-sm">
			A small catalog of single-page tools. Everything runs in your browser.
		</p>
	</div>

	<Input
		type="search"
		placeholder="Search tools…"
		aria-label="Search tools"
		bind:value={query}
	/>

	{#if filtered.length === 0}
		<p class="text-muted-foreground py-12 text-center text-sm">
			{tools.length === 0 ? 'No tools yet.' : 'No tools match your search.'}
		</p>
	{:else}
		<ul class="grid gap-4 sm:grid-cols-2">
			{#each filtered as tool (tool.slug)}
				<li>
					<a
						href="/{tool.slug}"
						class="focus-visible:ring-ring/60 block rounded-xl focus:outline-none focus-visible:ring-2"
					>
						<Card class="hover:bg-accent/40 h-full transition-colors">
							<CardHeader>
								<CardTitle class="text-base">{tool.title}</CardTitle>
								<CardDescription>{tool.description}</CardDescription>
							</CardHeader>
							{#if tool.tags && tool.tags.length > 0}
								<CardContent>
									<div class="flex flex-wrap gap-1.5">
										{#each tool.tags as tag (tag)}
											<span
												class="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-xs"
											>
												{tag}
											</span>
										{/each}
									</div>
								</CardContent>
							{/if}
						</Card>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</section>
