import { marked } from 'marked';
import hljs from 'highlight.js';
import DOMPurify from 'dompurify';
import markedKatex from 'marked-katex-extension';
import markedAlert from 'marked-alert';

marked.use(
	markedKatex({
		throwOnError: false
	})
);

marked.use(markedAlert());

const renderer = {
	code({ text, lang }) {
		if (lang === 'mermaid') {
			return `<div class="mermaid">${text}</div>`;
		}
		const language = hljs.getLanguage(lang) ? lang : 'plaintext';
		const highlighted = hljs.highlight(text, { language }).value;
		return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`;
	}
};

marked.use({ renderer });

export function renderMarkdown(content) {
	const html = marked.parse(content || '');
	return DOMPurify.sanitize(html, {
		USE_PROFILES: { html: true, svg: true, mathMl: true },
		ADD_TAGS: [
			'blockquote',
			'section',
			'div',
			'span',
			'svg',
			'path',
			'foreignObject',
			'details',
			'summary',
			'pre'
		],
		ADD_ATTR: [
			'class',
			'style',
			'viewBox',
			'd',
			'fill',
			'stroke',
			'stroke-width',
			'stroke-linecap',
			'stroke-linejoin',
			'width',
			'height',
			'data-processed'
		]
	});
}
