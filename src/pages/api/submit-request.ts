import type { APIRoute } from 'astro';
import { appendRequest } from '../../lib/dataStore';

const VALID_TIMES = ['any', 'morning', 'afternoon', 'evening'] as const;
const PHONE_PATTERN = /^[0-9+\-\s()]{7,20}$/;

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid request body.', 400);
  }

  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const timeRaw = typeof body.time === 'string' ? body.time : 'any';
  const time = (VALID_TIMES as readonly string[]).includes(timeRaw)
    ? (timeRaw as (typeof VALID_TIMES)[number])
    : 'any';

  if (!phone) {
    return jsonError('Phone number is required.', 400);
  }
  if (!PHONE_PATTERN.test(phone)) {
    return jsonError('Phone number is invalid.', 400);
  }

  await appendRequest({
    id: Date.now().toString(),
    name,
    phone,
    time,
    timestamp: new Date().toISOString(),
    contacted: false,
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
