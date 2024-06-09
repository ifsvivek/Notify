<script>
    export let title = '';
    export let content = '';
    const handleTitleChange = (e) => {
        title = e.target.value;
    };
    const handleChange = (e) => {
        content = e.target.value;
    };
    const handleSave = () => {
        const notes = JSON.parse(localStorage.getItem('notes')) || [];
        const newNote = { title, content };
        const newNotes = [...notes, newNote];
        localStorage.setItem('notes', JSON.stringify(newNotes));
        title = '';
        content = '';
    };
</script>
<div class="note-editor">
    <input
        type="text"
        class="note-title"
        placeholder="Title"
        bind:value={title}
        on:change={handleTitleChange}
    />
    <textarea
        class="note-content"
        placeholder="Write your note here..."
        bind:value={content}
        on:change={handleChange}
    />
    <button on:click={handleSave}>Save</button>
</div>