import { json } from '@sveltejs/kit';
import { createPool } from '@vercel/postgres';
import { POSTGRES_URL } from '$env/static/private';

const pool = createPool({
	connectionString: POSTGRES_URL
});

async function getUserId(cookies) {
	const sessionCookie = cookies.get('session');
	if (!sessionCookie) return null;

	try {
		const sessionData = JSON.parse(Buffer.from(sessionCookie, 'base64').toString());
		if (sessionData.exp < Math.floor(Date.now() / 1000)) {
			throw new Error('Session expired');
		}
		return sessionData.userId;
	} catch (error) {
		console.error('Error parsing session:', error);
		return null;
	}
}

export async function GET({ cookies }) {
	const userId = await getUserId(cookies);
	if (!userId) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { rows } = await pool.query(
			'SELECT * FROM notes WHERE user_id = $1 ORDER BY updated_at DESC',
			[userId]
		);
		return json(rows);
	} catch (err) {
		console.error('Error fetching notes:', err);
		return json({ error: 'Failed to fetch notes' }, { status: 500 });
	}
}

export async function POST({ request, cookies }) {
	const userId = await getUserId(cookies);
	if (!userId) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { title, content } = await request.json();
	try {
		const result = await pool.query(
			'INSERT INTO notes (user_id, title, content) VALUES ($1, $2, $3) RETURNING id, title, content, created_at, updated_at',
			[userId, title, content]
		);
		return json(result.rows[0], { status: 201 });
	} catch (err) {
		console.error('Error creating note:', err);
		return json({ error: 'Failed to create note' }, { status: 500 });
	}
}

export async function PUT({ request, cookies }) {
	const userId = await getUserId(cookies);
	if (!userId) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id, title, content } = await request.json();
	try {
		const result = await pool.query(
			'UPDATE notes SET title = $1, content = $2, updated_at = NOW() WHERE id = $3 AND user_id = $4 RETURNING id, title, content, created_at, updated_at',
			[title, content, id, userId]
		);
		if (result.rowCount === 0) {
			return json({ error: 'Note not found' }, { status: 404 });
		}
		return json(result.rows[0]);
	} catch (err) {
		console.error('Error updating note:', err);
		return json({ error: 'Failed to update note' }, { status: 500 });
	}
}

export async function DELETE({ request, cookies }) {
	const userId = await getUserId(cookies);
	if (!userId) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id } = await request.json();
	try {
		const result = await pool.query('DELETE FROM notes WHERE id = $1 AND user_id = $2', [
			id,
			userId
		]);
		if (result.rowCount === 0) {
			return json({ error: 'Note not found' }, { status: 404 });
		}
		return new Response(null, { status: 204 });
	} catch (err) {
		console.error('Error deleting note:', err);
		return json({ error: 'Failed to delete note' }, { status: 500 });
	}
}
