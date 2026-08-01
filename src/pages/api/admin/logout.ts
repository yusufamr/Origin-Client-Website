import type { APIRoute } from 'astro';
import { clearAdminCookie } from '../../../lib/adminAuth';

export const POST: APIRoute = async ({ cookies }) => {
  clearAdminCookie(cookies);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
