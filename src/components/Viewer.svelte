<script>
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
  
    export let title = '';
    export let content = '';
  
    function handleChange(event) {
      content = event.detail.value;
    }
  
    function handleTitleChange(event) {
      title = event.detail.value;
    }
  
    function handleSave() {
      dispatch('save', { title, content });
    }
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
  
  <style>
    .note-editor {
      display: flex;
      flex-direction: column;
      gap: 1rem; /* Add some space between title and content */
    }
  
    .note-title {
      font-size: 1.2rem;
    }
  </style>