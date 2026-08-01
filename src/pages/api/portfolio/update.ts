import type { APIRoute } from 'astro';
import { isAuthorized } from '../../../lib/adminAuth';
import { updatePortfolioItem, type PortfolioTextFields } from '../../../lib/dataStore';
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES } from '../../../lib/uploadValidation';

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

  const id = String(formData.get('id') ?? '').trim();
  const descriptionAr = String(formData.get('descriptionAr') ?? '').trim();
  const descriptionEn = String(formData.get('descriptionEn') ?? '').trim();
  const date = String(formData.get('date') ?? '').trim();

  if (!id) return json({ ok: false, error: 'Missing id.' }, 400);
  if (!descriptionAr || !descriptionEn) {
    return json({ ok: false, error: 'Both Arabic and English descriptions are required.' }, 400);
  }
  if (!date) {
    return json({ ok: false, error: 'Date is required.' }, 400);
  }

  let removeImages: string[] = [];
  const removeImagesRaw = formData.get('removeImages');
  if (typeof removeImagesRaw === 'string' && removeImagesRaw) {
    try {
      const parsed = JSON.parse(removeImagesRaw);
      if (Array.isArray(parsed)) removeImages = parsed.filter((p): p is string => typeof p === 'string');
    } catch {
      return json({ ok: false, error: 'Invalid removeImages payload.' }, 400);
    }
  }

  const files = formData.getAll('newImages').filter((f): f is File => f instanceof File && f.size > 0);
  const newImages: { buffer: Buffer; ext: string }[] = [];
  for (const file of files) {
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return json({ ok: false, error: 'Each image must be under 5MB.' }, 400);
    }
    const ext = ALLOWED_IMAGE_TYPES[file.type];
    if (!ext) {
      return json({ ok: false, error: 'Only JPG, PNG, or WebP images are allowed.' }, 400);
    }
    newImages.push({ buffer: Buffer.from(await file.arrayBuffer()), ext });
  }

  const fields: PortfolioTextFields = { descriptionAr, descriptionEn, date };
  const item = await updatePortfolioItem(id, fields, newImages, removeImages);
  if (!item) return json({ ok: false, error: 'Portfolio item not found.' }, 404);

  return json({ ok: true, item });
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
