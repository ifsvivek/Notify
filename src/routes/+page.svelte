<script>
	import { onMount } from 'svelte';
	import { marked } from 'marked';
	import hljs from 'highlight.js';
	import 'highlight.js/styles/github.css';
	import {
		auth,
		createUserWithEmailAndPassword,
		signInWithEmailAndPassword,
		signOut
	} from '$lib/firebase';

	let notes = [];
	let currentNote = { id: null, title: '', content: '' };
	let editMode = true;
	let user = null;
	let error = null;
	let email = '';
	let password = '';
	let isRegistering = false;
	let isLoading = false;
	let isDarkMode = false;
	let isMobileMenuOpen = false;
	let isSettingsPanelOpen = false;
	let customColors = {
		primary: '#3b82f6',
		secondary: '#10b981',
		background: '#ffffff',
		text: '#1f2937'
	};

	onMount(() => {
		auth.onAuthStateChanged(async (firebaseUser) => {
			user = firebaseUser;
			if (user) {
				try {
					const idToken = await user.getIdToken();
					const response = await fetch('/auth', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({ idToken })
					});
					if (!response.ok) {
						throw new Error('Failed to authenticate with the server');
					}
					await fetchNotes();
				} catch (err) {
					console.error('Error during authentication:', err);
					error = err.message;
				}
			}
		});

		marked.setOptions({
			highlight: function (code, lang) {
				if (lang && hljs.getLanguage(lang)) {
					return hljs.highlight(lang, code).value;
				} else {
					return hljs.highlightAuto(code).value;
				}
			}
		});
	});

	$: {
		if (typeof document !== 'undefined') {
			if (isDarkMode) {
				document.body.classList.add('dark');
			} else {
				document.body.classList.remove('dark');
			}
		}
	}

	async function handleAuth() {
		isLoading = true;
		error = null;
		try {
			let userCredential;
			if (isRegistering) {
				userCredential = await createUserWithEmailAndPassword(auth, email, password);
			} else {
				userCredential = await signInWithEmailAndPassword(auth, email, password);
			}
			user = userCredential.user;
			email = '';
			password = '';
		} catch (err) {
			console.error('Error during authentication:', err);
			error = err.message;
		} finally {
			isLoading = false;
		}
	}

	async function logout() {
		try {
			await signOut(auth);
			user = null;
			notes = [];
			currentNote = { id: null, title: '', content: '' };
		} catch (err) {
			console.error('Error during sign out:', err);
			error = 'Failed to sign out. Please try again.';
		}
	}

	async function fetchNotes() {
		try {
			const response = await fetch('/notes');
			if (!response.ok) {
				throw new Error('Failed to fetch notes');
			}
			notes = await response.json();
		} catch (err) {
			console.error('Error fetching notes:', err);
			error = 'Failed to fetch notes. Please try again.';
		}
	}

	async function createNewNote() {
		try {
			const response = await fetch('/notes', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ title: 'New Note', content: '' })
			});
			if (!response.ok) {
				throw new Error('Failed to create new note');
			}
			const newNote = await response.json();
			notes = [newNote, ...notes];
			currentNote = newNote;
			editMode = true;
			isMobileMenuOpen = false;
		} catch (err) {
			console.error('Error creating new note:', err);
			error = 'Failed to create new note. Please try again.';
		}
	}

	async function selectNote(note) {
		currentNote = { ...note };
		editMode = false;
		isMobileMenuOpen = false;
	}

	async function saveNote() {
		try {
			const response = await fetch('/notes', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(currentNote)
			});
			if (!response.ok) {
				throw new Error('Failed to save note');
			}
			const updatedNote = await response.json();
			const index = notes.findIndex((n) => n.id === updatedNote.id);
			if (index !== -1) {
				notes[index] = updatedNote;
				notes = [...notes];
			}
		} catch (err) {
			console.error('Error saving note:', err);
			error = 'Failed to save note. Please try again.';
		}
	}

	async function deleteNote() {
		try {
			const response = await fetch('/notes', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ id: currentNote.id })
			});
			if (!response.ok) {
				throw new Error('Failed to delete note');
			}
			notes = notes.filter((n) => n.id !== currentNote.id);
			currentNote = { id: null, title: '', content: '' };
		} catch (err) {
			console.error('Error deleting note:', err);
			error = 'Failed to delete note. Please try again.';
		}
	}

	function toggleEditMode() {
		editMode = !editMode;
		if (!editMode) {
			saveNote();
		}
	}

	function toggleTheme() {
		isDarkMode = !isDarkMode;
	}

	function toggleMobileMenu() {
		isMobileMenuOpen = !isMobileMenuOpen;
	}

	function toggleSettingsPanel() {
		isSettingsPanelOpen = !isSettingsPanelOpen;
	}

	function applyCustomColors() {
		if (typeof document !== 'undefined') {
			document.documentElement.style.setProperty('--color-primary', customColors.primary);
			document.documentElement.style.setProperty('--color-secondary', customColors.secondary);
			document.documentElement.style.setProperty('--color-background', customColors.background);
			document.documentElement.style.setProperty('--color-text', customColors.text);
		}
	}
</script>

<nav class="text-white p-4 sticky top-0 z-10">
	<div class="container mx-auto flex justify-between items-center">
		<h1 class="btn text-2xl font-bold">Notify</h1>
		{#if user}
			<div class="flex items-center space-x-4">
				<button class="btn" on:click={toggleTheme}>
					<i class={isDarkMode ? 'fas fa-sun' : 'fas fa-moon'}></i>
				</button>
				<button class="btn" on:click={toggleSettingsPanel}>
					<i class="fas fa-cog"></i>
				</button>
				<button class="btn btn-red" on:click={logout}>
					<i class="fas fa-sign-out-alt"></i>
				</button>
			</div>
		{/if}
	</div>
</nav>

<main class="container mx-auto p-4 min-h-screen">
	{#if error}
		<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
			<p>{error}</p>
		</div>
	{/if}

	{#if user}
		<div class="flex flex-col md:flex-row">
			<div class="w-full md:w-1/4 md:pr-4 mb-4 md:mb-0" style="flex-basis: 25%;">
				<button class="btn btn-primary w-full mb-4" on:click={createNewNote}>New Note</button>
				<button class="md:hidden btn w-full mb-4" on:click={toggleMobileMenu}>
					{isMobileMenuOpen ? 'Hide Notes' : 'Show Notes'}
				</button>
				<ul class={`note-list md:block ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
					{#each notes as note (note.id)}
						<li>
							<button
								class="w-full text-left p-2 hover:bg-opacity-20 hover:bg-primary rounded {note.id ===
								currentNote.id
									? 'bg-opacity-20 bg-primary'
									: ''}"
								on:click={() => selectNote(note)}
							>
								{note.title}
							</button>
						</li>
					{/each}
				</ul>
			</div>

			<div class="w-full md:w-3/4" style="max-width: 75%;">
				{#if currentNote.id}
					<div class="mb-4">
						<input
							type="text"
							bind:value={currentNote.title}
							class="w-full p-2 border rounded"
							placeholder="Note Title"
						/>
					</div>
					<div class="flex justify-between mb-4">
						<button class="btn btn-secondary" on:click={toggleEditMode}>
							{editMode ? 'Preview' : 'Edit'}
						</button>
						<button class="btn btn-red" on:click={deleteNote}>Delete</button>
					</div>
					{#if editMode}
						<textarea
							bind:value={currentNote.content}
							class="w-full h-64 p-2 border rounded"
							placeholder="Write your note in Markdown..."
						></textarea>
					{:else}
						<div class="markdown-preview border rounded p-4">
							{@html marked(currentNote.content)}
						</div>
					{/if}
				{:else}
					<p>Select a note or create a new one.</p>
				{/if}
			</div>
		</div>
	{:else}
		<div class="max-w-md mx-auto">
			<h2 class="text-2xl font-bold mb-4">{isRegistering ? 'Register' : 'Login'}</h2>
			<form on:submit|preventDefault={handleAuth} class="space-y-4">
				<div>
					<label for="email" class="block mb-1">Email</label>
					<input
						type="email"
						id="email"
						bind:value={email}
						required
						class="w-full p-2 border rounded"
					/>
				</div>
				<div>
					<label for="password" class="block mb-1">Password</label>
					<input
						type="password"
						id="password"
						bind:value={password}
						required
						class="w-full p-2 border rounded"
					/>
				</div>
				<button type="submit" class="btn btn-primary w-full" disabled={isLoading}>
					{#if isLoading}
						Loading...
					{:else}
						{isRegistering ? 'Register' : 'Login'}
					{/if}
				</button>
			</form>
			<p class="mt-4 text-center">
				{isRegistering ? 'Already have an account?' : 'Need an account?'}
				<button class="text-primary underline" on:click={() => (isRegistering = !isRegistering)}>
					{isRegistering ? 'Login' : 'Register'}
				</button>
			</p>
		</div>
	{/if}
</main>

{#if isSettingsPanelOpen}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
		<div class="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
			<h2 class="text-[#1f2937] text-2xl font-bold mb-4">Custom Colors</h2>
			<div class="space-y-4">
				<div>
					<label for="primary-color" class="text-[#1f2937] block mb-1">Primary Color</label>
					<input type="color" id="primary-color" bind:value={customColors.primary} class="w-full" />
				</div>
				<div>
					<label for="secondary-color" class="text-[#1f2937] block mb-1">Secondary Color</label>
					<input
						type="color"
						id="secondary-color"
						bind:value={customColors.secondary}
						class="w-full"
					/>
				</div>
				<div>
					<label for="background-color" class="text-[#1f2937] block mb-1">Background Color</label>
					<input
						type="color"
						id="background-color"
						bind:value={customColors.background}
						class="w-full"
					/>
				</div>
				<div>
					<label for="text-color" class="text-[#1f2937] block mb-1">Text Color</label>
					<input type="color" id="text-color" bind:value={customColors.text} class="w-full" />
				</div>
			</div>
			<div class="mt-6 flex justify-end space-x-4">
				<button class="text-[#1f2937]" on:click={toggleSettingsPanel}>Cancel</button>
				<button
					class="btn btn-primary"
					on:click={() => {
						applyCustomColors();
						toggleSettingsPanel();
					}}
				>
					Apply
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	:global(body) {
		transition:
			background-color 0.3s,
			color 0.3s;
		background-color: var(--color-background, #ffffff);
		color: var(--color-text, #1f2937);
	}
	:global(.dark) {
		--color-background: #1a202c;
		--color-text: #ffffff;
	}
	:global(.btn) {
		padding: 0.5rem 1rem;
		border-radius: 0.25rem;
		font-weight: 600;
		transition:
			background-color 0.3s,
			color 0.3s;
		color: var(--color-text, #1f2937); /* Ensure text color is set */
	}
	:global(.btn-primary) {
		background-color: var(--color-primary, #3b82f6);
		color: #ffffff;
	}
	:global(.btn-secondary) {
		background-color: var(--color-secondary, #10b981);
		color: #ffffff;
	}
	:global(.btn-red) {
		background-color: #ef4444;
		color: #ffffff;
	}
	:global(input, textarea) {
		color: var(--color-text, #1f2937); /* Ensure text color is set */
		background-color: var(--color-background, #ffffff); /* Ensure background color is set */
		border: 1px solid #d1d5db; /* Light border color */
	}
	:global(input:focus, textarea:focus) {
		outline: none;
		border-color: var(--color-primary, #3b82f6); /* Focus border color */
	}
	:global(.markdown-preview h1) {
		font-size: 1.5rem;
		font-weight: bold;
		margin-bottom: 0.5rem;
	}
	:global(.markdown-preview h2) {
		font-size: 1.25rem;
		font-weight: bold;
		margin-bottom: 0.5rem;
	}
	:global(.markdown-preview p) {
		margin-bottom: 1rem;
	}
	:global(.markdown-preview ul, .markdown-preview ol) {
		margin-bottom: 1rem;
		padding-left: 2rem;
	}
	:global(.markdown-preview li) {
		margin-bottom: 0.5rem;
	}
	:global(.markdown-preview pre) {
		margin-bottom: 1rem;
		padding: 1rem;
		background-color: #f3f4f6;
		border-radius: 0.25rem;
		overflow-x: auto;
	}
	:global(.dark .markdown-preview pre) {
		background-color: #374151;
	}
	:global(nav) {
		color: #ffffff; /* Ensure text color is set */
	}
	:global(nav h1) {
		color: #ffffff; /* Ensure text color is set */
	}
	:global(.note-list) {
		max-height: 300px; /* Set a maximum height for the note list */
		overflow-y: auto; /* Make the note list scrollable if it exceeds the maximum height */
	}
	:global(.note-list button) {
		color: var(--color-text, #1f2937); /* Text color based on theme */
		background-color: var(--color-background, #ffffff); /* Default background */
	}

	:global(.note-list button:hover) {
		background-color: var(--color-hover-background, #f3f4f6); /* Hover background based on theme */
	}

	:global(.note-list button.selected) {
		background-color: var(--color-selected-background, #e5e7eb); /* Background for selected note */
	}

	:global(.dark .note-list button) {
		color: var(--color-text, #ffffff); /* Dark mode text color */
		background-color: var(--color-background-dark, #1a202c); /* Dark mode background */
	}

	:global(.dark .note-list button:hover) {
		background-color: var(--color-hover-background-dark, #374151); /* Dark mode hover background */
	}

	:global(.dark .note-list button.selected) {
		background-color: var(
			--color-selected-background-dark,
			#2d3748
		); /* Dark mode selected note background */
	}

	:global(.fixed) {
		position: fixed;
	}
	:global(.inset-0) {
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
	}
	:global(.bg-black) {
		background-color: rgba(0, 0, 0, 0.5);
	}
	:global(.bg-opacity-50) {
		background-color: rgba(0, 0, 0, 0.5);
	}
	:global(.flex) {
		display: flex;
	}
	:global(.items-center) {
		align-items: center;
	}
	:global(.justify-center) {
		justify-content: center;
	}
	:global(.bg-white) {
		background-color: #ffffff;
	}
	:global(.p-6) {
		padding: 1.5rem;
	}
	:global(.rounded-lg) {
		border-radius: 0.5rem;
	}
	:global(.shadow-lg) {
		box-shadow:
			0 10px 15px -3px rgba(0, 0, 0, 0.1),
			0 4px 6px -2px rgba(0, 0, 0, 0.05);
	}
	:global(.w-full) {
		width: 100%;
	}
	:global(.max-w-md) {
		max-width: 28rem;
	}
</style>
