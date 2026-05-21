<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { evaluate } from './expression';
	import { meta } from './meta';

	interface HistoryEntry {
		expr: string;
		value: number;
	}

	let expr = $state('');
	let error = $state<string | null>(null);
	let lastResult = $state<number | null>(null);
	let history = $state<HistoryEntry[]>([]);
	let input: HTMLInputElement | null = $state(null);

	function compute() {
		const result = evaluate(expr);
		if (result.ok) {
			error = null;
			lastResult = result.value;
			history = [{ expr: expr.trim(), value: result.value }, ...history];
			// Select all so the next keystroke replaces; matches typical calculator feel.
			input?.select();
		} else {
			error = result.error;
			lastResult = null;
		}
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			compute();
			return;
		}
		if (event.key === 'ArrowUp' && history.length > 0) {
			event.preventDefault();
			expr = history[0].expr;
			// Place caret at end after recall.
			queueMicrotask(() => {
				if (input) {
					const len = input.value.length;
					input.setSelectionRange(len, len);
				}
			});
		}
	}

	function insert(entry: HistoryEntry) {
		expr = entry.expr;
		input?.focus();
	}

	function clearHistory() {
		history = [];
	}

	const formatted = $derived(
		lastResult === null
			? ''
			: // Trim float noise without losing precision for clean results.
				Number.isInteger(lastResult)
				? lastResult.toString()
				: Number(lastResult.toPrecision(12)).toString()
	);
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

	<div class="space-y-2">
		<!-- svelte-ignore a11y_autofocus -->
		<Input
			bind:ref={input}
			bind:value={expr}
			onkeydown={onKeydown}
			type="text"
			autofocus
			autocomplete="off"
			autocapitalize="off"
			autocorrect="off"
			spellcheck={false}
			placeholder="e.g. 2 * (3 + 4)"
			aria-label="Expression"
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={error ? 'calc-error' : 'calc-result'}
			class="font-mono"
		/>

		{#if error}
			<p id="calc-error" class="text-destructive text-sm" role="alert">{error}</p>
		{:else if formatted !== ''}
			<p id="calc-result" class="font-mono text-2xl tabular-nums">
				= {formatted}
			</p>
		{:else}
			<p id="calc-result" class="text-muted-foreground text-sm">
				Press <kbd class="bg-muted rounded px-1 py-0.5 text-xs">Enter</kbd> to evaluate.
				<kbd class="bg-muted rounded px-1 py-0.5 text-xs">↑</kbd> recalls the last entry.
			</p>
		{/if}
	</div>

	<div class="space-y-2">
		<div class="flex items-baseline justify-between">
			<h2 class="text-sm font-medium">History</h2>
			{#if history.length > 0}
				<Button variant="ghost" size="sm" onclick={clearHistory}>Clear history</Button>
			{/if}
		</div>

		{#if history.length === 0}
			<p class="text-muted-foreground text-sm">No history yet.</p>
		{:else}
			<Card>
				<CardContent class="p-0">
					<ul class="divide-border divide-y">
						{#each history as entry, idx (idx)}
							<li>
								<button
									type="button"
									class="hover:bg-accent/40 focus-visible:bg-accent/40 flex w-full items-baseline justify-between gap-4 px-4 py-2 text-left font-mono text-sm focus:outline-none"
									onclick={() => insert(entry)}
								>
									<span class="truncate">{entry.expr}</span>
									<span class="text-muted-foreground tabular-nums">= {entry.value}</span>
								</button>
							</li>
						{/each}
					</ul>
				</CardContent>
			</Card>
		{/if}
	</div>
</section>
