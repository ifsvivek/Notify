import { json } from '@sveltejs/kit';

export async function GET({ params, platform }) {
	const { id } = params;
	if (!platform?.env?.COLLAB_SESSIONS) {
		return json({ error: 'KV Namespace not bound' }, { status: 500 });
	}

	const session = await platform.env.COLLAB_SESSIONS.get(`session:${id}`, { type: 'json' });
	if (!session) {
		return json({ error: 'Session not found' }, { status: 404 });
	}

	return json(session);
}

export async function POST({ params, request, platform }) {
	const { id } = params;
	if (!platform?.env?.COLLAB_SESSIONS) {
		return json({ error: 'KV Namespace not bound' }, { status: 500 });
	}

	const body = await request.json();
	const { users, content, lastUpdated } = body;

	const session = {
		sessionId: id,
		users: users || {},
		content: content || '',
		lastUpdated: lastUpdated || Date.now()
	};

	// Store with 24h expiration
	await platform.env.COLLAB_SESSIONS.put(`session:${id}`, JSON.stringify(session), {
		expirationTtl: 86400
	});

	return json({ success: true });
}

export async function DELETE({ params, platform }) {
	const { id } = params;
	if (!platform?.env?.COLLAB_SESSIONS) {
		return json({ error: 'KV Namespace not bound' }, { status: 500 });
	}

	await platform.env.COLLAB_SESSIONS.delete(`session:${id}`);
	return json({ success: true });
}
