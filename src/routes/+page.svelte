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

	// State management
	let notes = [];
	let currentNote = { id: null, title: '', content: '' };
	let editMode = true;
	let user = null;
	let error = null;
	let email = '';
	let password = '';
	let isRegistering = false;
	let isLoading = false;
	let searchQuery = '';
	let isMobileMenuOpen = false;

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

	function closeMobileMenu() {
		isMobileMenuOpen = false;
	}

	// New function for search
	$: filteredNotes = notes.filter(
		(note) =>
			note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			note.content.toLowerCase().includes(searchQuery.toLowerCase())
	);

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
			},
			headerIds: true,
			gfm: true,
			breaks: true,
			sanitize: false // Allow HTML
		});
	});
</script>

<div class="min-h-screen bg-zinc-900">
	<!-- Mobile Menu Button -->
	<div class="md:hidden fixed top-4 right-4 z-30">
		<button
			class="p-2 rounded-md bg-zinc-800 shadow-lg"
			on:click={() => (isMobileMenuOpen = !isMobileMenuOpen)}
		>
			<svg class="w-6 h-6 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d={isMobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
				/>
			</svg>
		</button>
	</div>
	<!-- Sidebar -->
	<aside
		class="fixed top-0 left-0 h-full w-[280px] md:w-64 border-r border-zinc-800
    bg-zinc-900 z-20 transform transition-transform duration-200 ease-in-out
    {isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}"
	>
		<div class="p-5">
			<div class="flex items-center justify-between mb-8">
				<h1 class="text-xl font-medium text-zinc-100">Notify</h1>
				<div class="flex space-x-2">
					<button class="p-2 hover:bg-zinc-800 rounded-md" on:click={logout}>
						<svg
							class="w-5 h-5 text-zinc-500"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
							/>
						</svg>
					</button>
				</div>
			</div>

			<!-- Search Bar -->
			<div class="relative mb-6">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search..."
					class="w-full px-3 py-2 bg-zinc-800 border border-zinc-800 rounded-md text-zinc-100 text-sm placeholder-zinc-600 focus:outline-none focus:border-blue-400"
				/>
			</div>

			<!-- New Note Button -->
			<button
				on:click={createNewNote}
				class="w-full py-2 px-3 mb-6 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium transition-colors duration-150"
			>
				New Note
			</button>

			<!-- Notes List -->
			<div class="space-y-0.5">
				{#each filteredNotes as note (note.id)}
					<button
						on:click={() => selectNote(note)}
						class="w-full p-3 text-left rounded-md transition-colors duration-150
                        {currentNote.id === note.id ? 'bg-zinc-800' : 'hover:bg-zinc-800'}"
					>
						<h3 class="text-sm font-medium text-zinc-100 truncate">
							{note.title}
						</h3>
						<p class="text-xs text-zinc-400 truncate mt-1">{note.content}</p>
					</button>
				{/each}
			</div>
		</div>
	</aside>

	<!-- Main Content -->
	<main class=" md:ml-64 min-h-screen transition-all duration-200">
		{#if currentNote.id}
			<div class="max-w-3xl mx-auto px-8 py-6">
				<input
					type="text"
					bind:value={currentNote.title}
					class="w-full text-2xl font-medium bg-transparent border-none focus:outline-none text-zinc-100 mb-4"
					placeholder="Note title"
				/>

				<div class="flex space-x-3 mb-6">
					<button
						on:click={toggleEditMode}
						class="px-3 py-1.5 text-sm rounded-md transition-colors duration-150 {editMode
							? 'bg-emerald-800 text-zinc-100'
							: 'text-zinc-400 hover:text-zinc-300'}"
					>
						{editMode ? 'Editing' : 'Preview'}
					</button>
					<button
						on:click={deleteNote}
						class="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 transition-colors duration-150"
					>
						Delete
					</button>
				</div>

				{#if editMode}
					<textarea
						bind:value={currentNote.content}
						class="w-full h-[calc(100vh-250px)] p-4 bg-zinc-800 rounded-lg border border-zinc-700 focus:outline-none focus:border-blue-400 resize-none text-zinc-200 text-sm"
						placeholder="Write your note..."
					/>
				{:else}
					<div class="prose dark:prose-invert prose-zinc max-w-none markdown-body">
						{@html marked.parse(currentNote.content || '')}
					</div>
				{/if}
			</div>
		{:else}
			<div class="flex flex-col items-center justify-center h-[calc(100vh-100px)]">
				<p class="text-sm text-zinc-500">Select a note or create a new one</p>
			</div>
		{/if}
	</main>

	<!-- Mobile Backdrop -->
	{#if isMobileMenuOpen}
		<button
			type="button"
			class="fixed inset-0 bg-black/30 backdrop-blur-sm z-10 md:hidden"
			on:click={closeMobileMenu}
			on:keydown={closeMobileMenu}
			aria-label="Close menu"
		></button>
	{/if}

	<!-- Auth Modal -->
	{#if !user}
		<div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
			<div class="bg-zinc-900 rounded-lg shadow-xl p-6 w-full max-w-sm border border-zinc-800">
				<h2 class="text-xl font-medium text-zinc-100 mb-6">
					{isRegistering ? 'Create account' : 'Sign in'}
				</h2>

				<form on:submit|preventDefault={handleAuth} class="space-y-4">
					<div>
						<label for="email" class="block text-sm text-zinc-400 mb-1"> Email </label>
						<input
							type="email"
							id="email"
							bind:value={email}
							required
							class="w-full px-3 py-2 bg-transparent border border-zinc-800 rounded-md text-sm focus:outline-none focus:border-blue-400"
						/>
					</div>

					<div>
						<label for="password" class="block text-sm text-zinc-400 mb-1"> Password </label>
						<input
							type="password"
							id="password"
							bind:value={password}
							required
							class="w-full px-3 py-2 bg-transparent border border-zinc-800 rounded-md text-sm focus:outline-none focus:border-blue-400"
						/>
					</div>

					<button
						type="submit"
						class="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium transition-colors duration-150"
						disabled={isLoading}
					>
						{isLoading ? 'Please wait...' : isRegistering ? 'Create account' : 'Sign in'}
					</button>
				</form>

				<p class="mt-4 text-center text-sm text-zinc-400">
					{isRegistering ? 'Already have an account?' : "Don't have an account?"}
					<button
						class="text-blue-500 hover:text-blue-600 font-medium ml-1"
						on:click={() => (isRegistering = !isRegistering)}
					>
						{isRegistering ? 'Sign in' : 'Create one'}
					</button>
				</p>
			</div>
		</div>
	{/if}
</div>

<style>
	:global(body) {
		@apply antialiased;
		background-color: var(--bg-primary);
		color: var(--text-primary);
	}

	@media (max-width: 768px) {
		:global(button),
		:global(input),
		:global(textarea) {
			@apply min-h-[44px] min-w-[44px]; /* Better touch targets */
		}

		:global(.markdown-body) {
			@apply px-4;
		}

		main {
			@apply px-4;
		}

		/* Improve mobile spacing */
		.max-w-3xl {
			@apply px-4;
		}
	}

	/* Minimal scrollbar */
	::-webkit-scrollbar {
		width: 4px;
	}

	::-webkit-scrollbar-track {
		@apply bg-transparent;
	}

	::-webkit-scrollbar-thumb {
		@apply bg-zinc-700 rounded-full;
	}

	::-webkit-scrollbar-thumb:hover {
		@apply bg-zinc-600;
	}
	:global(.markdown-body) {
		@apply text-zinc-200;
	}

	:global(.markdown-body h1) {
		@apply text-2xl font-bold mt-6 mb-4;
	}

	:global(.markdown-body h2) {
		@apply text-xl font-bold mt-5 mb-3;
	}

	:global(.markdown-body p) {
		@apply mb-4;
	}

	:global(.markdown-body code) {
		@apply px-1 py-0.5 bg-zinc-800 rounded;
	}

	:global(.markdown-body pre code) {
		@apply p-4 block overflow-x-auto;
	}
</style>
