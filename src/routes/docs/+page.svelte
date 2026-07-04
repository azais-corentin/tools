<script lang="ts">
	import { Card, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { documents } from './documents';
	import { meta } from './meta';
</script>

<svelte:head>
	<title>{meta.title} · tools</title>
	<meta name="description" content={meta.description} />
</svelte:head>

<section class="space-y-6">
	<div class="space-y-2">
		<h1 class="text-2xl font-semibold tracking-tight">{meta.title}</h1>
		<p class="text-muted-foreground text-sm">{meta.description}</p>
	</div>

	{#if documents.length === 0}
		<p class="text-muted-foreground py-12 text-center text-sm">No documents yet.</p>
	{:else}
		<ul class="grid gap-4 sm:grid-cols-2">
			{#each documents as doc (doc.slug)}
				<li>
					<a
						href="/docs/{doc.slug}"
						class="focus-visible:ring-ring/60 block rounded-xl focus:outline-none focus-visible:ring-2"
					>
						<Card class="hover:bg-accent/40 h-full transition-colors">
							<CardHeader>
								<CardTitle class="text-base">{doc.title}</CardTitle>
							</CardHeader>
						</Card>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</section>
