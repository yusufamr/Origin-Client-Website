import type { APIRoute } from 'astro';
import { isAuthorized } from '../../../lib/adminAuth';
import { getProducts } from '../../../lib/dataStore';

export const GET: APIRoute = async ({ request, cookies }) => {
  if (!isAuthorized(request, cookies)) {
    return json({ ok: false, error: 'Unauthorized.' }, 401);
  }

  const items = await getProducts();
  return json({ ok: true, items });
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
