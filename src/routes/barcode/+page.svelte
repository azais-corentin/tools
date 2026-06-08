<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Card, CardContent } from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select';
	import * as Tabs from '$lib/components/ui/tabs';
	import Copy from '@lucide/svelte/icons/copy';
	import Check from '@lucide/svelte/icons/check';
	import Download from '@lucide/svelte/icons/download';
	import {
		FORMATS,
		DEFAULT_STYLE,
		DOT_TYPES,
		renderFormat,
		type RenderStyle,
		type Control,
		type FormatGroup
	} from './render';
	import { HELPERS, renderHelper, helperDefaults } from './helpers';
	import { svgToPng } from './png';
	import { meta } from './meta';

	const GROUP_ORDER: FormatGroup[] = ['1D', '2D', 'Stacked', 'Postal', 'Color'];
	const GROUP_LABELS: Record<FormatGroup, string> = {
		'1D': '1D barcodes',
		'2D': '2D codes',
		Stacked: 'Stacked',
		Postal: 'Postal (4-state)',
		Color: 'Color'
	};
	const grouped = GROUP_ORDER.map((g) => ({
		group: g,
		items: FORMATS.filter((f) => f.group === g)
	}));
	const CONTENT_CONTROLS: Control[] = ['size', 'margin', 'ec', 'dot', 'color', 'background'];

	let mode = $state<'format' | 'content'>('format');
	let formatId = $state('qr');
	let formatInput = $state(FORMATS.find((f) => f.id === 'qr')!.sample);
	let helperId = $state('wifi');
	let helperValues = $state<Record<string, string>>(
		helperDefaults(HELPERS.find((h) => h.id === 'wifi')!)
	);
	let style = $state<RenderStyle>({ ...DEFAULT_STYLE });

	let copied = $state(false);
	let pngError = $state('');

	const fmt = $derived(FORMATS.find((f) => f.id === formatId)!);
	const helper = $derived(HELPERS.find((h) => h.id === helperId)!);
	const styleControls = $derived(mode === 'format' ? fmt.controls : CONTENT_CONTROLS);
	const fileBase = $derived(mode === 'format' ? formatId : helperId);

	const result = $derived.by((): { svg: string | null; error: string | null } => {
		try {
			const svg =
				mode === 'format'
					? renderFormat(formatId, formatInput, style)
					: renderHelper(helperId, helperValues, style);
			return { svg, error: null };
		} catch (e) {
			return { svg: null, error: e instanceof Error ? e.message : String(e) };
		}
	});

	function selectFormat(v: string) {
		formatId = v;
		formatInput = FORMATS.find((f) => f.id === v)?.sample ?? '';
	}

	function selectHelper(v: string) {
		helperId = v;
		const def = HELPERS.find((h) => h.id === v);
		if (def) helperValues = helperDefaults(def);
	}

	function setNum(key: 'size' | 'margin' | 'height' | 'barWidth', raw: string) {
		const n = Number(raw);
		if (Number.isFinite(n)) style[key] = n;
	}

	function downloadBlob(blob: Blob, filename: string) {
		const u = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = u;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(u);
	}

	async function copySvg() {
		if (!result.svg) return;
		try {
			await navigator.clipboard.writeText(result.svg);
			copied = true;
			setTimeout(() => (copied = false), 1500);
		} catch {
			/* clipboard unavailable */
		}
	}

	function downloadSvg() {
		if (!result.svg) return;
		downloadBlob(new Blob([result.svg], { type: 'image/svg+xml' }), `${fileBase}.svg`);
	}

	async function downloadPng() {
		if (!result.svg) return;
		pngError = '';
		try {
			downloadBlob(await svgToPng(result.svg), `${fileBase}.png`);
		} catch (e) {
			pngError = e instanceof Error ? e.message : String(e);
		}
	}
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

	<div class="grid gap-6 md:grid-cols-2">
		<!-- Controls -->
		<div class="space-y-5">
			<Tabs.Root value={mode} onValueChange={(v) => (mode = v as 'format' | 'content')}>
				<Tabs.List class="grid w-full grid-cols-2">
					<Tabs.Trigger value="format">Format</Tabs.Trigger>
					<Tabs.Trigger value="content">Content</Tabs.Trigger>
				</Tabs.List>

				<Tabs.Content value="format" class="space-y-3 pt-4">
					<div class="space-y-1.5">
						<Label for="fmt-select">Symbology</Label>
						<Select.Root type="single" value={formatId} onValueChange={(v) => v && selectFormat(v)}>
							<Select.Trigger id="fmt-select" class="w-full" aria-label="Symbology">
								{fmt.label}
							</Select.Trigger>
							<Select.Content>
								{#each grouped as g (g.group)}
									{#if g.items.length}
										<Select.Group>
											<Select.GroupHeading>{GROUP_LABELS[g.group]}</Select.GroupHeading>
											{#each g.items as f (f.id)}
												<Select.Item value={f.id} label={f.label}>{f.label}</Select.Item>
											{/each}
										</Select.Group>
									{/if}
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<div class="space-y-1.5">
						<Label for="fmt-data">Data</Label>
						<Textarea
							id="fmt-data"
							bind:value={formatInput}
							placeholder={fmt.sample}
							aria-label="Data to encode"
							class="font-mono"
						/>
					</div>
				</Tabs.Content>

				<Tabs.Content value="content" class="space-y-3 pt-4">
					<div class="space-y-1.5">
						<Label for="helper-select">Content type</Label>
						<Select.Root type="single" value={helperId} onValueChange={(v) => v && selectHelper(v)}>
							<Select.Trigger id="helper-select" class="w-full" aria-label="Content type">
								{helper.label}
							</Select.Trigger>
							<Select.Content>
								{#each HELPERS as h (h.id)}
									<Select.Item value={h.id} label={h.label}>{h.label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					{#each helper.fields as field (field.name)}
						<div class="space-y-1.5">
							<Label for={`h-${field.name}`}>
								{field.label}{#if field.required}<span class="text-destructive"> *</span>{/if}
							</Label>
							{#if field.type === 'textarea'}
								<Textarea
									id={`h-${field.name}`}
									bind:value={helperValues[field.name]}
									placeholder={field.placeholder}
								/>
							{:else if field.type === 'select'}
								<Select.Root type="single" bind:value={helperValues[field.name]}>
									<Select.Trigger id={`h-${field.name}`} class="w-full" aria-label={field.label}>
										{(field.options ?? []).find((o) => o.value === helperValues[field.name])?.label ??
											'Select…'}
									</Select.Trigger>
									<Select.Content>
										{#each field.options ?? [] as opt (opt.value)}
											<Select.Item value={opt.value} label={opt.label}>{opt.label}</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							{:else}
								<Input
									id={`h-${field.name}`}
									type={field.type === 'number'
										? 'number'
										: field.type === 'datetime'
											? 'datetime-local'
											: 'text'}
									bind:value={helperValues[field.name]}
									placeholder={field.placeholder}
								/>
							{/if}
						</div>
					{/each}
				</Tabs.Content>
			</Tabs.Root>

			<!-- Style panel -->
			<div class="space-y-3 border-t pt-4">
				<h2 class="text-sm font-medium">Style</h2>
				<div class="grid grid-cols-2 gap-3">
					{#each styleControls as c (c)}
						{#if c === 'size'}
							<div class="space-y-1.5">
								<Label for="sty-size">Size (px)</Label>
								<Input
									id="sty-size"
									type="number"
									min={32}
									max={2048}
									value={style.size}
									oninput={(e) => setNum('size', e.currentTarget.value)}
									aria-label="Size in pixels"
								/>
							</div>
						{:else if c === 'margin'}
							<div class="space-y-1.5">
								<Label for="sty-margin">Quiet zone</Label>
								<Input
									id="sty-margin"
									type="number"
									min={0}
									max={32}
									value={style.margin}
									oninput={(e) => setNum('margin', e.currentTarget.value)}
									aria-label="Quiet zone modules"
								/>
							</div>
						{:else if c === 'height'}
							<div class="space-y-1.5">
								<Label for="sty-height">Bar height (px)</Label>
								<Input
									id="sty-height"
									type="number"
									min={8}
									max={400}
									value={style.height}
									oninput={(e) => setNum('height', e.currentTarget.value)}
									aria-label="Bar height in pixels"
								/>
							</div>
						{:else if c === 'barWidth'}
							<div class="space-y-1.5">
								<Label for="sty-barwidth">Bar width (px)</Label>
								<Input
									id="sty-barwidth"
									type="number"
									min={1}
									max={12}
									value={style.barWidth}
									oninput={(e) => setNum('barWidth', e.currentTarget.value)}
									aria-label="Module width in pixels"
								/>
							</div>
						{:else if c === 'ec'}
							<div class="space-y-1.5">
								<Label for="sty-ec">Error correction</Label>
								<Select.Root
									type="single"
									value={style.ecLevel}
									onValueChange={(v) => v && (style.ecLevel = v as RenderStyle['ecLevel'])}
								>
									<Select.Trigger id="sty-ec" class="w-full" aria-label="Error correction level">
										{style.ecLevel}
									</Select.Trigger>
									<Select.Content>
										{#each ['L', 'M', 'Q', 'H'] as lvl (lvl)}
											<Select.Item value={lvl} label={lvl}>{lvl}</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							</div>
						{:else if c === 'dot'}
							<div class="space-y-1.5">
								<Label for="sty-dot">Dot style</Label>
								<Select.Root
									type="single"
									value={style.dotType}
									onValueChange={(v) => v && (style.dotType = v as RenderStyle['dotType'])}
								>
									<Select.Trigger id="sty-dot" class="w-full" aria-label="Dot style">
										{style.dotType}
									</Select.Trigger>
									<Select.Content>
										{#each DOT_TYPES as d (d)}
											<Select.Item value={d} label={d}>{d}</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							</div>
						{:else if c === 'jabColors'}
							<div class="space-y-1.5">
								<Label for="sty-jab">Colors</Label>
								<Select.Root
									type="single"
									value={String(style.jabColors)}
									onValueChange={(v) => v && (style.jabColors = Number(v) as RenderStyle['jabColors'])}
								>
									<Select.Trigger id="sty-jab" class="w-full" aria-label="JAB Code colors">
										{style.jabColors}-color
									</Select.Trigger>
									<Select.Content>
										<Select.Item value="4" label="4-color">4-color</Select.Item>
										<Select.Item value="8" label="8-color">8-color</Select.Item>
									</Select.Content>
								</Select.Root>
							</div>
						{:else if c === 'showText'}
							<div class="space-y-1.5">
								<Label for="sty-showtext">Show text</Label>
								<Select.Root
									type="single"
									value={String(style.showText)}
									onValueChange={(v) => v && (style.showText = v === 'true')}
								>
									<Select.Trigger id="sty-showtext" class="w-full" aria-label="Show human-readable text">
										{style.showText ? 'Yes' : 'No'}
									</Select.Trigger>
									<Select.Content>
										<Select.Item value="true" label="Yes">Yes</Select.Item>
										<Select.Item value="false" label="No">No</Select.Item>
									</Select.Content>
								</Select.Root>
							</div>
						{:else if c === 'color'}
							<div class="space-y-1.5">
								<Label for="sty-color">Foreground</Label>
								<div class="flex gap-2">
									<input
										id="sty-color"
										type="color"
										class="border-input h-8 w-10 shrink-0 rounded-md border bg-transparent p-0.5"
										value={style.color}
										oninput={(e) => (style.color = e.currentTarget.value)}
										aria-label="Foreground color"
									/>
									<Input bind:value={style.color} class="font-mono" aria-label="Foreground hex" />
								</div>
							</div>
						{:else if c === 'background'}
							<div class="space-y-1.5">
								<Label for="sty-bg">Background</Label>
								<div class="flex gap-2">
									<input
										id="sty-bg"
										type="color"
										class="border-input h-8 w-10 shrink-0 rounded-md border bg-transparent p-0.5"
										value={style.background === 'transparent' ? '#ffffff' : style.background}
										oninput={(e) => (style.background = e.currentTarget.value)}
										aria-label="Background color"
									/>
									<Input
										bind:value={style.background}
										class="font-mono"
										aria-label="Background hex or transparent"
									/>
								</div>
							</div>
						{/if}
					{/each}
				</div>
			</div>
		</div>

		<!-- Preview + actions -->
		<div class="space-y-3">
			<Card>
				<CardContent class="space-y-4 p-4">
					{#if result.svg}
						<div
							class="bg-muted flex min-h-48 items-center justify-center rounded-lg p-4 [&_svg]:h-auto [&_svg]:max-w-full"
						>
							{@html result.svg}
						</div>
					{:else}
						<div class="text-destructive bg-destructive/10 min-h-48 rounded-lg p-4 text-sm">
							{result.error}
						</div>
					{/if}

					<div class="flex flex-wrap gap-2">
						<Button variant="outline" size="sm" onclick={copySvg} disabled={!result.svg}>
							{#if copied}
								<Check class="size-4" /> Copied
							{:else}
								<Copy class="size-4" /> Copy SVG
							{/if}
						</Button>
						<Button variant="outline" size="sm" onclick={downloadSvg} disabled={!result.svg}>
							<Download class="size-4" /> SVG
						</Button>
						<Button variant="outline" size="sm" onclick={downloadPng} disabled={!result.svg}>
							<Download class="size-4" /> PNG
						</Button>
					</div>

					{#if pngError}
						<p class="text-destructive text-xs">{pngError}</p>
					{/if}
				</CardContent>
			</Card>
		</div>
	</div>
</section>
