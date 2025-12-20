<script>
	import { noteStore } from '$lib/store.svelte.ts';
	import { renderMarkdown } from '$lib/markdown.js';
	import { fade } from 'svelte/transition';
	import { tick } from 'svelte';
	import mermaid from 'mermaid';

	let viewMode = $state('split'); // 'edit', 'preview', 'split'
	let isSidebarOpen = $state(true);

	$effect(() => {
		if (noteStore.activeNote?.content && viewMode !== 'edit') {
			tick().then(async () => {
				const elements = document.querySelectorAll('.mermaid');
				for (const el of elements) {
					if (el.getAttribute('data-processed')) continue;
					
					const content = el.textContent;
					const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
					try {
						const { svg } = await mermaid.render(id, content);
						el.innerHTML = svg;
						el.setAttribute('data-processed', 'true');
					} catch (err) {
						console.error('Mermaid render error:', err);
						el.innerHTML = `<pre class="text-red-500 p-4 bg-red-50 rounded-lg">${err.message}</pre>`;
					}
				}
			});
		}
	});

	function toggleSidebar() {
		isSidebarOpen = !isSidebarOpen;
	}

	function getSnippet(content) {
		const lines = content.split('\n');
		const snippet = lines.length > 1 ? lines.slice(1).join(' ') : '';
		return snippet.trim().substring(0, 60) + (snippet.length > 60 ? '...' : '');
	}
</script>

<div
	class="flex h-screen overflow-hidden bg-[#fdfbf7] font-sans text-[#2c1810] selection:bg-orange-200"
>
	<!-- Sidebar -->
	<aside
		class="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[#e8e2d5]/50 bg-[#f5f2ea]/80 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 {isSidebarOpen
			? 'translate-x-0'
			: '-translate-x-full'}"
	>
		<div class="flex items-center justify-between p-6">
			<div class="flex items-center gap-3">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e67e22] shadow-lg shadow-orange-900/10"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5 text-white"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
						stroke-linecap="round"
						stroke-linejoin="round"
						><path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8.5" /><path
							d="M15 13l-3 3l-3-3"
						/><path d="M12 3v13" /></svg
					>
				</div>
				<h1 class="text-xl font-bold tracking-tight text-[#1a0f0a]">Notify</h1>
			</div>
			<button
				class="rounded-lg p-2 text-[#8d7768] transition-all hover:bg-[#e8e2d5] hover:text-[#1a0f0a] lg:hidden"
				onclick={toggleSidebar}
				aria-label="Close Sidebar"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"
					></line></svg
				>
			</button>
		</div>

		<div class="mb-4 px-4">
			<div class="group relative">
				<input
					type="text"
					placeholder="Search notes..."
					class="w-full rounded-xl border border-[#dcd4c5]/50 bg-[#e8e2d5]/50 py-2.5 pr-4 pl-10 text-sm text-[#2c1810] placeholder-[#a69080] transition-all focus:border-[#e67e22] focus:ring-2 focus:ring-[#e67e22]/20 focus:outline-none"
					bind:value={noteStore.searchQuery}
				/>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="absolute top-3 left-3.5 h-4 w-4 text-[#a69080] transition-colors group-focus-within:text-[#e67e22]"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
				</svg>
			</div>
		</div>

		<div class="custom-scrollbar flex-1 overflow-y-auto px-2 pb-4">
			<div class="space-y-1">
				{#each noteStore.filteredNotes as note (note.id)}
					<button
						class="group relative w-full cursor-pointer overflow-hidden rounded-xl p-4 text-left transition-all {noteStore.activeNoteId ===
						note.id
							? 'border border-[#e67e22]/20 bg-[#e67e22]/10'
							: 'border border-transparent hover:bg-[#e8e2d5]/50'}"
						onclick={() => {
							noteStore.selectNote(note.id);
							if (window.innerWidth < 1024) isSidebarOpen = false;
						}}
					>
						{#if noteStore.activeNoteId === note.id}
							<div class="absolute top-0 bottom-0 left-0 my-3 w-1 rounded-full bg-[#e67e22]"></div>
						{/if}
						<div
							class="mb-1 truncate font-semibold text-[#2c1810] transition-colors group-hover:text-[#1a0f0a]"
						>
							{note.title || 'Untitled Note'}
						</div>
						<div
							class="mb-2 line-clamp-1 text-xs text-[#8d7768] transition-colors group-hover:text-[#3d2b1f]"
						>
							{getSnippet(note.content) || 'No additional content'}
						</div>
						<div
							class="text-[10px] font-bold tracking-wider text-[#bca89a] uppercase transition-colors group-hover:text-[#8d7768]"
						>
							{new Date(note.updatedAt).toLocaleDateString(undefined, {
								month: 'short',
								day: 'numeric'
							})} • {new Date(note.updatedAt).toLocaleTimeString([], {
								hour: '2-digit',
								minute: '2-digit'
							})}
						</div>
					</button>
				{/each}
			</div>

			{#if noteStore.filteredNotes.length === 0}
				<div class="p-8 text-center" in:fade>
					<div class="mb-3 text-3xl opacity-20">🔍</div>
					<p class="text-sm text-[#8d7768]">
						{noteStore.searchQuery ? 'No matching notes found.' : 'Your notebook is empty.'}
					</p>
				</div>
			{/if}
		</div>

		<div class="border-t border-[#e8e2d5]/50 p-4">
			<button
				class="flex w-full items-center justify-center gap-2 rounded-xl bg-[#e67e22] py-3 font-semibold text-white shadow-lg shadow-orange-900/10 transition-all hover:bg-[#d35400] active:scale-[0.98]"
				onclick={() => {
					noteStore.addNote();
					if (window.innerWidth < 1024) isSidebarOpen = false;
				}}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"
					></line></svg
				>
				New Note
			</button>
		</div>
	</aside>

	<!-- Main Content -->
	<main class="relative flex h-full flex-1 flex-col overflow-hidden bg-[#fdfbf7]">
		{#if noteStore.activeNote}
			<!-- Toolbar -->
			<header
				class="z-10 flex h-16 items-center justify-between border-b border-[#e8e2d5]/50 bg-[#f5f2ea]/30 px-6 backdrop-blur-md"
			>
				<div class="flex items-center gap-4">
					<button
						class="rounded-lg p-2 text-[#8d7768] transition-all hover:bg-[#e8e2d5] hover:text-[#1a0f0a] lg:hidden"
						onclick={toggleSidebar}
						aria-label="Open Sidebar"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"
							></line><line x1="3" y1="18" x2="21" y2="18"></line></svg
						>
					</button>

					<!-- View Toggles -->
					<div class="flex rounded-xl border border-[#dcd4c5]/30 bg-[#e8e2d5]/50 p-1">
						<button
							class="rounded-lg px-4 py-1.5 text-xs font-bold tracking-wider uppercase transition-all {viewMode ===
							'edit'
								? 'bg-[#e67e22] text-white shadow-md'
								: 'text-[#8d7768] hover:text-[#2c1810]'}"
							onclick={() => (viewMode = 'edit')}
						>
							Edit
						</button>
						<button
							class="rounded-lg px-4 py-1.5 text-xs font-bold tracking-wider uppercase transition-all {viewMode ===
							'split'
								? 'bg-[#e67e22] text-white shadow-md'
								: 'text-[#8d7768] hover:text-[#2c1810]'}"
							onclick={() => (viewMode = 'split')}
						>
							Split
						</button>
						<button
							class="rounded-lg px-4 py-1.5 text-xs font-bold tracking-wider uppercase transition-all {viewMode ===
							'preview'
								? 'bg-[#e67e22] text-white shadow-md'
								: 'text-[#8d7768] hover:text-[#2c1810]'}"
							onclick={() => (viewMode = 'preview')}
						>
							Preview
						</button>
					</div>
				</div>

				<!-- Actions -->
				<div class="flex items-center gap-3">
					<button
						class="rounded-xl p-2.5 text-[#8d7768] transition-all hover:bg-red-50 hover:text-red-600 active:scale-95"
						onclick={() => {
							if (confirm('Are you sure you want to delete this note?')) {
								noteStore.deleteNote(noteStore.activeNote.id);
							}
						}}
						title="Delete Note"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							><polyline points="3 6 5 6 21 6"></polyline><path
								d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
							></path><line x1="10" y1="11" x2="10" y2="17"></line><line
								x1="14"
								y1="11"
								x2="14"
								y2="17"
							></line></svg
						>
					</button>
				</div>
			</header>

			<div class="flex flex-1 overflow-hidden">
				<!-- Editor -->
				<div
					class="flex flex-1 flex-col transition-all duration-300 {viewMode === 'preview'
						? 'hidden'
						: 'flex'} {viewMode === 'split' ? 'border-r border-[#e8e2d5]/50' : ''}"
					in:fade={{ duration: 200 }}
				>
					<textarea
						class="custom-scrollbar h-full w-full flex-1 resize-none bg-transparent p-10 font-mono text-[15px] leading-relaxed text-[#2c1810] focus:outline-none"
						placeholder="# Title&#10;&#10;Start writing your note here..."
						value={noteStore.activeNote.content}
						oninput={(e) => noteStore.updateNote(noteStore.activeNote.id, e.target.value)}
					></textarea>
				</div>

				<!-- Preview -->
				<div
					class="custom-scrollbar flex flex-1 flex-col overflow-y-auto bg-[#fdfbf7]/50 {viewMode ===
					'edit'
						? 'hidden'
						: 'flex'}"
					in:fade={{ duration: 200 }}
				>
					<div class="mx-auto prose w-full max-w-3xl p-10">
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html renderMarkdown(noteStore.activeNote.content)}
					</div>
				</div>
			</div>
		{:else}
			<div
				class="relative flex flex-1 items-center justify-center overflow-hidden bg-[#fdfbf7]"
				in:fade
			>
				<!-- Decorative background elements -->
				<div
					class="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-orange-600/5 blur-[120px]"
				></div>
				<div
					class="absolute right-1/4 bottom-1/4 h-64 w-64 rounded-full bg-yellow-600/5 blur-[120px]"
				></div>

				<div class="relative z-10 px-6 text-center">
					<div
						class="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl border border-[#e8e2d5] bg-white shadow-xl"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-12 w-12 text-[#e67e22]"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
							><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"
							></path><polyline points="14 2 14 8 20 8"></polyline><line
								x1="16"
								y1="13"
								x2="8"
								y2="13"
							></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"
							></line></svg
						>
					</div>
					<h2 class="mb-4 text-3xl font-bold tracking-tight text-[#1a0f0a]">
						Capture your thoughts
					</h2>
					<p class="mx-auto mb-10 max-w-sm leading-relaxed text-[#8d7768]">
						Notify is a minimal markdown note-taking app designed for focus and clarity.
					</p>
					<button
						class="mx-auto flex items-center gap-3 rounded-2xl bg-[#e67e22] px-8 py-4 font-bold text-white shadow-xl shadow-orange-900/20 transition-all hover:-translate-y-1 hover:bg-[#d35400] active:scale-95"
						onclick={() => noteStore.addNote()}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
							stroke-linecap="round"
							stroke-linejoin="round"
							><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"
							></line></svg
						>
						Create your first note
					</button>
				</div>
			</div>
		{/if}
	</main>

	<!-- Mobile Overlay -->
	{#if isSidebarOpen}
		<button
			class="fixed inset-0 z-40 bg-[#2c1810]/20 backdrop-blur-sm lg:hidden"
			onclick={toggleSidebar}
			transition:fade
			aria-label="Close Sidebar"
		></button>
	{/if}
</div>

<style>
	:global(.line-clamp-1) {
		display: -webkit-box;
		-webkit-line-clamp: 1;
		line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
