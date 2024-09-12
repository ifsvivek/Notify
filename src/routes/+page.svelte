<script>
	import { onMount } from 'svelte';
	import { marked } from 'marked';
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
	});

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
		document.body.classList.toggle('dark', isDarkMode);
	}

	function toggleMobileMenu() {
		isMobileMenuOpen = !isMobileMenuOpen;
	}
</script>

<main class="container mx-auto p-4 min-h-screen">
	<h1 class="text-3xl font-bold mb-4">Notify</h1>

	{#if error}
		<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
			<p>{error}</p>
		</div>
	{/if}

	{#if user}
		<div class="flex flex-col sm:flex-row justify-between items-center mb-4">
			<p class="mb-2 sm:mb-0">Welcome, {user.email}!</p>
			<div class="flex flex-wrap justify-center sm:justify-end">
				<button class="btn h-12 mr-2 mb-2 sm:mb-0" on:click={toggleTheme}>
					{isDarkMode ? 'Light Mode' : 'Dark Mode'}
				</button>
				<button class="btn h-12" on:click={logout}> Logout </button>
			</div>
		</div>

		<div class="flex flex-col sm:flex-row">
			<div class="w-full sm:w-1/4 sm:pr-4 mb-4 sm:mb-0">
				<button
					class="bg-blue-500 text-white px-4 py-2 rounded mb-4 w-full"
					on:click={createNewNote}
				>
					New Note
				</button>
				<button
					class="sm:hidden bg-gray-500 text-white px-4 py-2 rounded mb-4 w-full"
					on:click={toggleMobileMenu}
				>
					{isMobileMenuOpen ? 'Hide Notes' : 'Show Notes'}
				</button>
				<ul class={`sm:block ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
					{#each notes as note (note.id)}
						<li
							class="cursor-pointer p-2 hover:bg-gray-100 rounded"
							class:bg-gray-200={note.id === currentNote.id}
							on:click={() => selectNote(note)}
							role="button"
							tabindex="0"
							on:keydown={(e) => e.key === 'Enter' && selectNote(note)}
						>
							{note.title}
						</li>
					{/each}
				</ul>
			</div>

			<div class="w-full sm:w-3/4">
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
				<button
					type="submit"
					class="bg-blue-500 text-white px-4 py-2 rounded w-full"
					disabled={isLoading}
				>
					{#if isLoading}
						Loading...
					{:else}
						{isRegistering ? 'Register' : 'Login'}
					{/if}
				</button>
			</form>
			<p class="mt-4 text-center">
				{isRegistering ? 'Already have an account?' : 'Need an account?'}
				<button class="text-blue-500 underline" on:click={() => (isRegistering = !isRegistering)}>
					{isRegistering ? 'Login' : 'Register'}
				</button>
			</p>
		</div>
	{/if}
</main>

<style>
	:global(body) {
		transition: colors 0.2s;
	}
	:global(.dark) {
		background-color: #1a202c;
		color: #fff;
	}
	:global(.dark .bg-red-100) {
		background-color: #742a2a;
		color: #fed7d7;
	}
	:global(.dark .bg-blue-500) {
		background-color: #2b6cb0;
	}
	:global(.dark .bg-green-500) {
		background-color: #2f855a;
	}
	:global(.dark .bg-red-500) {
		background-color: #c53030;
	}
	:global(.dark .bg-gray-100) {
		background-color: #2d3748;
	}
	:global(.dark .bg-gray-200) {
		background-color: #4a5568;
	}
	:global(.dark input),
	:global(.dark textarea) {
		background-color: #2d3748;
		color: #fff;
		border-color: #718096;
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
	.btn {
		background-color: #6b7280;
		color: #fff;
		padding: 0.5rem 1rem;
		border-radius: 0.25rem;
	}
</style>
