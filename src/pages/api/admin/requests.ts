import type { APIRoute } from 'astro';
import { isAuthorized } from '../../../lib/adminAuth';
import { getRequests, setRequestContacted } from '../../../lib/dataStore';

export const GET: APIRoute = async ({ request, cookies }) => {
  if (!isAuthorized(request, cookies)) {
    return json({ ok: false, error: 'Unauthorized.' }, 401);
  }

  const requests = await getRequests();
  requests.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return json({ ok: true, requests });
};

export const PATCH: APIRoute = async ({ request, cookies }) => {
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
  const contacted = Boolean(body.contacted);
  if (!id) return json({ ok: false, error: 'Missing id.' }, 400);

  const updated = await setRequestContacted(id, contacted);
  if (!updated) return json({ ok: false, error: 'Request not found.' }, 404);

  return json({ ok: true });
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
