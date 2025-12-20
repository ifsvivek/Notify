import { browser } from '$app/environment';

export type Note = {
	id: string;
	title: string;
	content: string;
	updatedAt: number;
};

class NoteStore {
	notes = $state<Note[]>([]);
	activeNoteId = $state<string | null>(null);
	searchQuery = $state('');
	theme = $state<'light' | 'dark'>('light');

	constructor() {
		if (browser) {
			const stored = localStorage.getItem('notify-notes');
			if (stored) {
				try {
					this.notes = JSON.parse(stored);
				} catch (e) {
					console.error('Failed to load notes', e);
					this.notes = [];
				}
			}

			const storedTheme = localStorage.getItem('notify-theme');
			if (storedTheme === 'dark' || storedTheme === 'light') {
				this.theme = storedTheme;
			} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
				this.theme = 'dark';
			}
		}
	}

	toggleTheme() {
		this.theme = this.theme === 'light' ? 'dark' : 'light';
		if (browser) {
			localStorage.setItem('notify-theme', this.theme);
			document.documentElement.classList.toggle('dark', this.theme === 'dark');
		}
	}

	get activeNote() {
		return this.notes.find((n) => n.id === this.activeNoteId);
	}

	get filteredNotes() {
		if (!this.searchQuery) return this.notes;
		const lowerQuery = this.searchQuery.toLowerCase();
		return this.notes.filter(
			(n) =>
				n.title.toLowerCase().includes(lowerQuery) || n.content.toLowerCase().includes(lowerQuery)
		);
	}

	addNote() {
		const newNote: Note = {
			id: crypto.randomUUID(),
			title: '',
			content: '',
			updatedAt: Date.now()
		};
		this.notes = [newNote, ...this.notes];
		this.activeNoteId = newNote.id;
		this.save();
	}

	updateNote(id: string, content: string) {
		const note = this.notes.find((n) => n.id === id);
		if (note) {
			note.content = content;
			// Extract title from first line or default to Untitled
			const firstLine = content.split('\n')[0].replace(/^#+\s*/, '');
			note.title = firstLine.trim() || 'Untitled Note';
			note.updatedAt = Date.now();
			this.save();
		}
	}

	deleteNote(id: string) {
		this.notes = this.notes.filter((n) => n.id !== id);
		if (this.activeNoteId === id) {
			this.activeNoteId = null;
		}
		this.save();
	}

	selectNote(id: string) {
		this.activeNoteId = id;
	}

	save() {
		if (browser) {
			localStorage.setItem('notify-notes', JSON.stringify(this.notes));
		}
	}
}

export const noteStore = new NoteStore();
