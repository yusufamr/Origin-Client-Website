import type { APIRoute } from 'astro';
import { checkPassword, setAdminCookie } from '../../../lib/adminAuth';

export const POST: APIRoute = async ({ request, cookies }) => {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid request body.' }, 400);
  }

  const password = typeof body.password === 'string' ? body.password : '';
  if (!password || !checkPassword(password)) {
    return json({ ok: false, error: 'Incorrect password.' }, 401);
  }

  setAdminCookie(cookies, import.meta.env.PROD);
  return json({ ok: true });
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
