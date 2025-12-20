<script>
    import { noteStore } from '$lib/store.svelte.ts';
    import { renderMarkdown } from '$lib/markdown.js';

    let viewMode = $state('split'); // 'edit', 'preview', 'split'
</script>

<div class="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
    <!-- Sidebar -->
    <aside class="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div class="p-4 border-b border-slate-800 flex justify-between items-center">
            <h1 class="text-xl font-bold text-slate-100">Notify 📝</h1>
            <button 
                class="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white cursor-pointer transition-colors shadow-lg shadow-blue-900/20"
                onclick={() => noteStore.addNote()}
                aria-label="New Note"
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                </svg>
            </button>
        </div>
        
        <div class="p-3">
            <div class="relative">
                <input 
                    type="text" 
                    placeholder="Search notes..." 
                    class="w-full p-2 pl-9 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-200 placeholder-slate-500 transition-all"
                    bind:value={noteStore.searchQuery}
                />
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 absolute left-3 top-2.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
        </div>

        <div class="flex-1 overflow-y-auto custom-scrollbar">
            {#each noteStore.filteredNotes as note (note.id)}
                <button
                    class="w-full text-left p-3 border-b border-slate-800/50 hover:bg-slate-800 transition-all cursor-pointer group {noteStore.activeNoteId === note.id ? 'bg-slate-800 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}"
                    onclick={() => noteStore.selectNote(note.id)}
                >
                    <div class="font-medium truncate text-slate-200 group-hover:text-white transition-colors">{note.title || 'Untitled Note'}</div>
                    <div class="text-xs text-slate-500 mt-1 group-hover:text-slate-400">
                        {new Date(note.updatedAt).toLocaleDateString()} {new Date(note.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                </button>
            {/each}
            
            {#if noteStore.filteredNotes.length === 0}
                <div class="p-8 text-center text-slate-500 text-sm">
                    {noteStore.searchQuery ? 'No matching notes found.' : 'No notes yet. Create one to get started!'}
                </div>
            {/if}
        </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col h-full relative bg-slate-950">
        {#if noteStore.activeNote}
            <!-- Toolbar -->
            <div class="h-14 border-b border-slate-800 flex justify-between items-center px-4 bg-slate-900/50 backdrop-blur-sm">
                <!-- View Toggles -->
                <div class="flex bg-slate-800 rounded-lg p-1">
                    <button 
                        class="px-3 py-1.5 text-sm font-medium rounded-md transition-all {viewMode === 'edit' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}"
                        onclick={() => viewMode = 'edit'}
                        title="Editor Only"
                    >
                        Editor
                    </button>
                    <button 
                        class="px-3 py-1.5 text-sm font-medium rounded-md transition-all {viewMode === 'split' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}"
                        onclick={() => viewMode = 'split'}
                        title="Split View"
                    >
                        Split
                    </button>
                    <button 
                        class="px-3 py-1.5 text-sm font-medium rounded-md transition-all {viewMode === 'preview' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}"
                        onclick={() => viewMode = 'preview'}
                        title="Preview Only"
                    >
                        Preview
                    </button>
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-2">
                    <button 
                        class="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors cursor-pointer"
                        onclick={() => {
                            if(confirm('Are you sure you want to delete this note?')) {
                                noteStore.deleteNote(noteStore.activeNote.id);
                            }
                        }}
                        title="Delete Note"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>

            <div class="flex-1 flex overflow-hidden">
                <!-- Editor -->
                <div class="flex-1 flex flex-col {viewMode === 'preview' ? 'hidden' : 'flex'} {viewMode === 'split' ? 'border-r border-slate-800' : ''}">
                    <textarea
                        class="flex-1 w-full h-full p-8 bg-slate-950 text-slate-200 resize-none focus:outline-none font-mono text-base leading-relaxed selection:bg-blue-500/30"
                        placeholder="# Title&#10;&#10;Start writing your note here..."
                        value={noteStore.activeNote.content}
                        oninput={(e) => noteStore.updateNote(noteStore.activeNote.id, e.target.value)}
                    ></textarea>
                </div>

                <!-- Preview -->
                <div class="flex-1 flex flex-col bg-slate-950 overflow-y-auto {viewMode === 'edit' ? 'hidden' : 'flex'}">
                    <div class="prose prose-invert prose-slate max-w-none p-8 prose-headings:text-slate-100 prose-a:text-blue-400 hover:prose-a:text-blue-300 prose-code:text-blue-300 prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800">
                        {@html renderMarkdown(noteStore.activeNote.content)}
                    </div>
                </div>
            </div>

        {:else}
            <div class="flex-1 flex items-center justify-center text-slate-600 bg-slate-950">
                <div class="text-center">
                    <div class="text-6xl mb-6 opacity-50">📝</div>
                    <h2 class="text-2xl font-bold text-slate-300 mb-2">Welcome to Notify</h2>
                    <p class="text-slate-500 mb-8 max-w-md mx-auto">Select a note from the sidebar or create a new one to get started with your thoughts.</p>
                    <button 
                        class="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium cursor-pointer transition-all shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 hover:-translate-y-0.5"
                        onclick={() => noteStore.addNote()}
                    >
                        Create New Note
                    </button>
                </div>
            </div>
        {/if}
    </main>
</div>
