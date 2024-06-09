<script>
	let tabs = ['files', 'search', 'sourceControl', 'extensions', 'settings', 'help'];
	let activeTab = 'files';
</script>

{#each tabs as tab (tab)}
	<div class="p-4">
		<button class:active={activeTab === tab} on:click={() => (activeTab = tab)} title={tab}>
			<div class="icon w-8 h-8 bg-gray-500"></div>
		</button>
	</div>
{/each}

<style>
	.active {
		color: #007acc;
	}
	.icon:hover {
		background-color: #007acc;
	}
</style>
