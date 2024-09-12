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
		} catch (err) {
			console.error('Error creating new note:', err);
			error = 'Failed to create new note. Please try again.';
		}
	}

	async function selectNote(note) {
		currentNote = { ...note };
		editMode = false;
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
</script>

<main class="container mx-auto p-4">
	<h1 class="text-3xl font-bold mb-4">Markdown Note App</h1>

	{#if error}
		<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
			<p>{error}</p>
		</div>
	{/if}

	{#if user}
		<div class="flex justify-between items-center mb-4">
			<p>Welcome, {user.email}!</p>
			<button class="bg-red-500 text-white px-4 py-2 rounded" on:click={logout}> Logout </button>
		</div>

		<div class="flex">
			<div class="w-1/4 pr-4">
				<button class="bg-blue-500 text-white px-4 py-2 rounded mb-4" on:click={createNewNote}>
					New Note
				</button>
				<ul>
					{#each notes as note (note.id)}
						<li
							class="cursor-pointer p-2 hover:bg-gray-100"
							class:bg-gray-200={note.id === currentNote.id}
							on:click={() => selectNote(note)}
						>
							{note.title}
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
