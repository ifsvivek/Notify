<script>
	import './layout.css';
	import 'highlight.js/styles/github.css';
	import 'katex/dist/katex.min.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import mermaid from 'mermaid';

	let { children } = $props();

	onMount(() => {
		mermaid.initialize({
			startOnLoad: false,
			theme: 'neutral',
			securityLevel: 'loose'
		});
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
</svelte:head>

<div class="font-sans antialiased">
	{@render children()}
</div>
