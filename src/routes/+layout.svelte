<script>
	import './layout.css';
	import 'katex/dist/katex.min.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import mermaid from 'mermaid';
	import { noteStore } from '$lib/store.svelte.ts';

	let { children } = $props();

	onMount(() => {
		// Initialize theme from store
		document.documentElement.classList.toggle('dark', noteStore.theme === 'dark');

		mermaid.initialize({
			startOnLoad: false,
			theme: noteStore.theme === 'dark' ? 'dark' : 'neutral',
			securityLevel: 'loose'
		});
	});

	// Update mermaid theme when app theme changes
	$effect(() => {
		if (noteStore.theme) {
			mermaid.initialize({
				theme: noteStore.theme === 'dark' ? 'dark' : 'neutral'
			});
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
		rel="stylesheet"
	/>
	{#if noteStore.theme === 'dark'}
		<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">
	{:else}
		<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css">
	{/if}
</svelte:head>

<div class="font-sans antialiased">
	{@render children()}
</div>
