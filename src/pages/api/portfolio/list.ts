import type { APIRoute } from 'astro';
import { isAuthorized } from '../../../lib/adminAuth';
import { getPortfolioItems } from '../../../lib/dataStore';

export const GET: APIRoute = async ({ request, cookies }) => {
  if (!isAuthorized(request, cookies)) {
    return json({ ok: false, error: 'Unauthorized.' }, 401);
  }

  const items = await getPortfolioItems();
  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return json({ ok: true, items });
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
