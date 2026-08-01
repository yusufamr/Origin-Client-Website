import type { APIRoute } from 'astro';
import { isAuthorized } from '../../../lib/adminAuth';
import { reorderProduct } from '../../../lib/dataStore';

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isAuthorized(request, cookies)) {
    return json({ ok: false, error: 'Unauthorized.' }, 401);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid request body.' }, 400);
  }

  const id = typeof body.id === 'string' ? body.id : '';
  const direction = body.direction === 'up' || body.direction === 'down' ? body.direction : '';
  if (!id || !direction) return json({ ok: false, error: 'Missing id or direction.' }, 400);

  const moved = await reorderProduct(id, direction);
  if (!moved) return json({ ok: false, error: 'Unable to reorder.' }, 400);

  return json({ ok: true });
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
