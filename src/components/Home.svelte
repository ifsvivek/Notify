<script>
	import Side from './Side.svelte';
	import Viewer from './Viewer.svelte';
	let title = '';
	let content = '';
</script>

<div class="rounded-3xl h-full w-full fixed top-0 right-0 bottom-0 left-0 bg-[#16181D] border-4 border-[#1C1F26] flex items-center">
    <div class="h-full w-64 text-white flex flex-col">
        <div class="p-4 text-center bg-blue-500 text-white py-2">
            <h1>Note-Taking App</h1>
        </div>
        <Side />
    </div>
    <div class="flex-grow flex items-center">
        <Viewer bind:title bind:content />
    </div>
</div>