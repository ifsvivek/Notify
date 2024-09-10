<script>
	import { onMount } from 'svelte';
	import { marked } from 'marked';

	let notes = [];
	let currentNote = { id: null, title: '', content: '' };
	let editMode = true;

	onMount(() => {
		const savedNotes = localStorage.getItem('markdown-notes');
		if (savedNotes) {
			notes = JSON.parse(savedNotes);
		}
	});

	function saveNotes() {
		localStorage.setItem('markdown-notes', JSON.stringify(notes));
	}

	function createNewNote() {
		currentNote = { id: Date.now(), title: 'New Note', content: '' };
		notes = [currentNote, ...notes];
		editMode = true;
		saveNotes();
	}

	function selectNote(note) {
		currentNote = { ...note };
		editMode = false;
	}

	function saveNote() {
		const index = notes.findIndex((n) => n.id === currentNote.id);
		if (index !== -1) {
			notes[index] = currentNote;
			notes = [...notes];
			saveNotes();
		}
	}

	function deleteNote() {
		notes = notes.filter((n) => n.id !== currentNote.id);
		currentNote = { id: null, title: '', content: '' };
		saveNotes();
	}

	function toggleEditMode() {
		editMode = !editMode;
		if (!editMode) {
			saveNote();
		}
	}
</script>

<main class="container mx-auto p-4 bg-gray-900 text-white">
	<h1 class="text-3xl font-bold mb-4">Notisfy</h1>

	<div class="flex">
		<div class="w-1/4 pr-4">
			<button class="bg-blue-500 text-white px-4 py-2 rounded mb-4" on:click={createNewNote}>
				New Note
			</button>
			<ul>
				{#each notes as note (note.id)}
					<li>
						<button
							class="w-full text-left cursor-pointer p-2 hover:bg-gray-700 bg-gray-800 rounded mb-2"
							class:bg-gray-600={note.id === currentNote.id}
							on:click={() => selectNote(note)}
						>
							{note.title}
						</button>
					</li>
				{/each}
			</ul>
		</div>

		<div class="w-3/4">
			{#if currentNote.id}
				<div class="mb-4">
					<input
						type="text"
						bind:value={currentNote.title}
						class="w-full p-2 border rounded bg-gray-800 text-white"
						placeholder="Note Title"
					/>
				</div>
				<div class="flex justify-between mb-4">
					<button class="bg-green-500 text-white px-4 py-2 rounded" on:click={toggleEditMode}>
						{editMode ? 'Preview' : 'Edit'}
					</button>
					<button class="bg-red-500 text-white px-4 py-2 rounded" on:click={deleteNote}>
						Delete
					</button>
				</div>
				{#if editMode}
					<textarea
						bind:value={currentNote.content}
						class="w-full h-64 p-2 border rounded bg-gray-800 text-white"
						placeholder="Write your note in Markdown..."
					></textarea>
				{:else}
					<div class="markdown-preview border rounded p-4 bg-gray-800 text-white">
						{@html marked(currentNote.content)}
					</div>
				{/if}
			{:else}
				<p>Select a note or create a new one.</p>
			{/if}
		</div>
	</div>
</main>

<style>
	:global(body) {
		background-color: #1a202c; /* Dark background */
		color: #f7fafc; /* Light text color */
	}

	:global(.markdown-preview h1) {
		font-size: 2em;
		font-weight: bold;
		margin-bottom: 0.5em;
	}
	:global(.markdown-preview h2) {
		font-size: 1.5em;
		font-weight: bold;
		margin-bottom: 0.5em;
	}
	:global(.markdown-preview p) {
		margin-bottom: 1em;
	}
	:global(.markdown-preview ul, .markdown-preview ol) {
		margin-bottom: 1em;
		padding-left: 2em;
	}
	:global(.markdown-preview li) {
		margin-bottom: 0.5em;
	}
</style>
