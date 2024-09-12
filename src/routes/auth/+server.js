import { json } from '@sveltejs/kit';

export async function POST({ request, fetch, cookies }) {
    const { idToken } = await request.json();
    try {
        // Verify the ID token using Firebase Auth REST API
        const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${import.meta.env.VITE_FIREBASE_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ idToken })
        });

        if (!response.ok) {
            throw new Error('Failed to verify ID token');
        }

        const data = await response.json();
        const userId = data.users[0].localId;

        // Create a session cookie (this is a simplified version, you might want to use a more secure method in production)
        const expiresIn = 60 * 60 * 24 * 5; // 5 days
        const sessionCookie = Buffer.from(JSON.stringify({ userId, exp: Math.floor(Date.now() / 1000) + expiresIn })).toString('base64');

        // Set the cookie using the cookies API
        cookies.set('session', sessionCookie, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: expiresIn
        });

        return json({ status: 'success' });
    } catch (error) {
        console.error('Authentication error:', error);
        return json({ error: 'Unauthorized' }, { status: 401 });
    }
}