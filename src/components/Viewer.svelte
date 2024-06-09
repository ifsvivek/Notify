<script>
	import { onMount } from 'svelte';
	import marked from 'marked';
	export let text;

	let html;

	onMount(() => {
		html = marked(text);
	});
</script>

<div class="w-full h-full" innerHTML={html} />
