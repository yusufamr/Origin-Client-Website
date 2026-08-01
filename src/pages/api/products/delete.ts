import type { APIRoute } from 'astro';
import { isAuthorized } from '../../../lib/adminAuth';
import { deleteProduct } from '../../../lib/dataStore';

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
  if (!id) return json({ ok: false, error: 'Missing id.' }, 400);

  const removed = await deleteProduct(id);
  if (!removed) return json({ ok: false, error: 'Product not found.' }, 404);

  return json({ ok: true });
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
