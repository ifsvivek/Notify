<script>
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import * as Y from 'yjs';
	import { renderMarkdown } from '$lib/markdown.js';
	import { noteStore } from '$lib/store.svelte.ts';
	import { fade } from 'svelte/transition';
	import { tick } from 'svelte';

	const collabId = $page.params.id;
	let viewMode = $state('split');
	let content = $state('');
	let title = $state('Collaborative Note');
	let status = $state('Connecting...');
	let users = $state(1);
	let mermaid;

	let ydoc;
	let provider;
	let ytext;
	let textareaRef = $state();

	onMount(async () => {
		if (ydoc) return;

		const m = await import('mermaid');
		mermaid = m.default || m;

		// Polyfill Buffer and process for y-webrtc/simple-peer in production
		const { Buffer } = await import('buffer');
		if (typeof window !== 'undefined') {
			window.Buffer = Buffer;
			window.global = window;
			window.process = { env: {}, nextTick: (cb) => setTimeout(cb, 0) };
		}

		const { WebrtcProvider } = await import('y-webrtc');
		const { IndexeddbPersistence } = await import('y-indexeddb');
		
		ydoc = new Y.Doc();
		
		// 1. Local Persistence (Offline Support)
		// This ensures data is saved even if connection fails
		const indexeddbProvider = new IndexeddbPersistence(`notify-store-${collabId}`, ydoc);
		
		// 2. Real-time Sync via WebRTC
		// We use a reliable signaling server.
		provider = new WebrtcProvider(`notify-v6-${collabId}`, ydoc, {
			signaling: ['wss://y-webrtc.fly.dev'],
			peerOpts: {
				config: {
					iceServers: [
						{ urls: 'stun:stun.l.google.com:19302' },
						{ urls: 'stun:global.stun.twilio.com:3478' }
					]
				}
			}
		});

		// For debugging in browser console
		window.ydoc = ydoc;
		window.provider = provider;
		console.log(`Connecting to room: notify-v6-${collabId}`);

		// Awareness helps keep the connection alive
		provider.awareness.setLocalStateField('user', {
			name: 'User ' + Math.floor(Math.random() * 100),
			color: '#' + Math.floor(Math.random()*16777215).toString(16)
		});

		provider.on('status', (event) => {
			status = event.connected ? 'Connected' : 'Connecting...';
			if (event.connected) {
				console.log('Connected to signaling server');
			}
		});

		provider.awareness.on('change', () => {
			users = provider.awareness.getStates().size;
		});

		ytext = ydoc.getText('content');

		// Initial seed from URL
		const urlParams = new URLSearchParams(window.location.search);
		const initialContent = urlParams.get('content');
		const initialTitle = urlParams.get('title');

		if (initialTitle) title = initialTitle;

		ytext.observe((event) => {
			console.log('Yjs update received');
			const newContent = ytext.toString();
			if (content !== newContent) {
				content = newContent;

				if (textareaRef) {
					// If we're focused, we need to preserve the cursor position
					if (document.activeElement === textareaRef) {
						const cursorStart = textareaRef.selectionStart;
						const cursorEnd = textareaRef.selectionEnd;

						// Update value
						textareaRef.value = newContent;

						// Restore cursor (this is a simple version, might need adjustment for complex diffs)
						textareaRef.setSelectionRange(cursorStart, cursorEnd);
					} else {
						textareaRef.value = newContent;
					}
				}
			}
		});

		// Seed if empty after a short delay to allow sync
		setTimeout(() => {
			if (ytext.toString() === '' && initialContent) {
				ydoc.transact(() => {
					ytext.insert(0, initialContent);
				});
			}
		}, 1000);
	});

	onDestroy(() => {
		if (provider) provider.destroy();
		if (ydoc) ydoc.destroy();
	});

	function handleInput(e) {
		const newText = e.target.value;
		const oldText = ytext.toString();

		if (newText === oldText) return;

		// Calculate minimal diff to preserve Yjs performance and remote cursors
		let start = 0;
		while (start < oldText.length && start < newText.length && oldText[start] === newText[start]) {
			start++;
		}

		let endOld = oldText.length;
		let endNew = newText.length;
		while (endOld > start && endNew > start && oldText[endOld - 1] === newText[endNew - 1]) {
			endOld--;
			endNew--;
		}

		ydoc.transact(() => {
			if (endOld > start) {
				ytext.delete(start, endOld - start);
			}
			if (endNew > start) {
				ytext.insert(start, newText.slice(start, endNew));
			}
		});

		content = newText;
	}

	$effect(() => {
		if (content && viewMode !== 'edit') {
			tick().then(async () => {
				const elements = document.querySelectorAll('.mermaid');
				for (const el of elements) {
					const currentTheme = noteStore.theme;
					const mContent = decodeURIComponent(el.getAttribute('data-content') || el.textContent);
					const processedTheme = el.getAttribute('data-processed-theme');

					if (processedTheme === currentTheme) continue;

					const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
					try {
						const { svg } = await mermaid.render(id, mContent);
						el.innerHTML = svg;
						el.setAttribute('data-processed-theme', currentTheme);
					} catch (err) {
						console.error('Mermaid render error:', err);
					}
				}
			});
		}
	});

	function copyLink() {
		const url = new URL(window.location.href);
		url.searchParams.set('title', title);
		url.searchParams.set('content', content);
		navigator.clipboard.writeText(url.toString());
		alert('Collaboration link copied to clipboard!');
	}

	function reconnect() {
		if (provider) {
			provider.disconnect();
			provider.connect();
			status = 'Reconnecting...';
		}
	}

	function forceSync() {
		ydoc.transact(() => {
			ytext.insert(0, ' ');
			ytext.delete(0, 1);
		});
		alert('Sync signal sent!');
	}
</script>

<div class="flex h-screen flex-col bg-(--bg-primary) text-(--text-primary)">
	<header
		class="z-10 flex h-16 items-center justify-between border-b border-(--border)/50 bg-(--bg-secondary)/30 px-6 backdrop-blur-md"
	>
		<div class="flex items-center gap-4">
			<a
				href="/"
				class="flex h-8 w-8 items-center justify-center rounded-lg bg-(--accent) shadow-lg shadow-orange-900/10"
				aria-label="Back to Home"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5 text-white"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg
				>
			</a>
			<div class="flex flex-col">
				<h1 class="text-sm font-bold text-(--text-primary)">{title}</h1>
				<div class="flex items-center gap-2 text-[10px] font-medium tracking-wider uppercase">
					<button
						onclick={reconnect}
						class="{status === 'Connected' ? 'text-green-500' : 'text-yellow-500'} hover:underline"
					>
						{status}
					</button>
					<span class="text-(--text-secondary)">•</span>
					<span class="text-(--text-secondary)"
						>{users} {users === 1 ? 'user' : 'users'} online</span
					>
					<span class="text-(--text-secondary)">•</span>
					<span class="text-(--text-secondary) opacity-50">Room: {collabId}</span>
				</div>
			</div>
		</div>

		<div class="flex items-center gap-3">
			<div class="flex rounded-xl border border-(--border)/30 bg-(--bg-secondary)/50 p-1">
				<button
					class="rounded-lg px-4 py-1.5 text-xs font-bold tracking-wider uppercase transition-all {viewMode ===
					'edit'
						? 'bg-(--accent) text-white shadow-md'
						: 'text-(--text-secondary) hover:text-(--text-primary)'}"
					onclick={() => (viewMode = 'edit')}>Edit</button
				>
				<button
					class="rounded-lg px-4 py-1.5 text-xs font-bold tracking-wider uppercase transition-all {viewMode ===
					'split'
						? 'bg-(--accent) text-white shadow-md'
						: 'text-(--text-secondary) hover:text-(--text-primary)'}"
					onclick={() => (viewMode = 'split')}>Split</button
				>
				<button
					class="rounded-lg px-4 py-1.5 text-xs font-bold tracking-wider uppercase transition-all {viewMode ===
					'preview'
						? 'bg-(--accent) text-white shadow-md'
						: 'text-(--text-secondary) hover:text-(--text-primary)'}"
					onclick={() => (viewMode = 'preview')}>Preview</button
				>
			</div>

			<button
				class="flex items-center gap-2 rounded-xl bg-(--accent) px-4 py-2 text-xs font-bold text-white shadow-lg shadow-orange-900/20 transition-all hover:-translate-y-0.5 active:scale-95"
				onclick={copyLink}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path
						d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
					></path></svg
				>
				Copy Link
			</button>

			<button
				class="flex items-center gap-2 rounded-xl border border-(--border) bg-(--bg-secondary) px-4 py-2 text-xs font-bold text-(--text-primary) transition-all hover:-translate-y-0.5 active:scale-95"
				onclick={forceSync}
				title="Force a sync signal if changes aren't appearing"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					><path
						d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"
					/></svg
				>
				Sync
			</button>

			<button
				class="flex items-center gap-2 rounded-xl border border-(--border) bg-(--bg-secondary) px-4 py-2 text-xs font-bold text-(--text-primary) transition-all hover:-translate-y-0.5 active:scale-95"
				onclick={() => {
					noteStore.addNote();
					const newNote = noteStore.notes[0];
					noteStore.updateNote(newNote.id, content);
					alert('Note imported to your local collection!');
				}}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
					></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline
						points="7 3 7 8 15 8"
					></polyline></svg
				>
				Import
			</button>
		</div>
	</header>

	<div class="flex flex-1 overflow-hidden">
		<div
			class="flex flex-1 flex-col transition-all duration-300 {viewMode === 'preview'
				? 'hidden'
				: 'flex'} {viewMode === 'split' ? 'border-r border-(--border)/50' : ''}"
		>
			<textarea
				bind:this={textareaRef}
				class="custom-scrollbar h-full w-full flex-1 resize-none bg-transparent p-10 font-mono text-[15px] leading-relaxed text-(--text-primary) focus:outline-none"
				placeholder="Start collaborating..."
				value={content}
				oninput={handleInput}
			></textarea>
		</div>

		<div
			class="custom-scrollbar flex flex-1 flex-col overflow-y-auto bg-(--bg-primary)/50 {viewMode ===
			'edit'
				? 'hidden'
				: 'flex'}"
		>
			<div class="mx-auto prose w-full max-w-3xl p-10">
				{@html renderMarkdown(content)}
			</div>
		</div>
	</div>
</div>
