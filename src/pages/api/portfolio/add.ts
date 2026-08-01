import type { APIRoute } from 'astro';
import { isAuthorized } from '../../../lib/adminAuth';
import { addPortfolioItem } from '../../../lib/dataStore';

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isAuthorized(request, cookies)) {
    return json({ ok: false, error: 'Unauthorized.' }, 401);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json({ ok: false, error: 'Invalid form data.' }, 400);
  }

  const image = formData.get('image');
  const descriptionAr = String(formData.get('descriptionAr') ?? '').trim();
  const descriptionEn = String(formData.get('descriptionEn') ?? '').trim();
  const date = String(formData.get('date') ?? '').trim();

  if (!(image instanceof File) || image.size === 0) {
    return json({ ok: false, error: 'Image file is required.' }, 400);
  }
  if (!descriptionAr || !descriptionEn) {
    return json({ ok: false, error: 'Both Arabic and English descriptions are required.' }, 400);
  }
  if (!date) {
    return json({ ok: false, error: 'Date is required.' }, 400);
  }
  if (image.size > MAX_SIZE_BYTES) {
    return json({ ok: false, error: 'Image exceeds the 5MB limit.' }, 400);
  }
  const ext = ALLOWED_TYPES[image.type];
  if (!ext) {
    return json({ ok: false, error: 'Only JPG, PNG, or WebP images are allowed.' }, 400);
  }

  const buffer = Buffer.from(await image.arrayBuffer());
  const item = await addPortfolioItem({ descriptionAr, descriptionEn, date }, buffer, ext);

  return json({ ok: true, item }, 201);
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
