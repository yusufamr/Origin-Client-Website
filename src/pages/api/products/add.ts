import type { APIRoute } from 'astro';
import { isAuthorized } from '../../../lib/adminAuth';
import { addProduct, type ProductTextFields } from '../../../lib/dataStore';
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

  const titleEn = String(formData.get('titleEn') ?? '').trim();
  const titleAr = String(formData.get('titleAr') ?? '').trim();
  const taglineEn = String(formData.get('taglineEn') ?? '').trim();
  const taglineAr = String(formData.get('taglineAr') ?? '').trim();
  const articleEn = String(formData.get('articleEn') ?? '').trim();
  const articleAr = String(formData.get('articleAr') ?? '').trim();
  const videoUrl = String(formData.get('videoUrl') ?? '').trim();

  if (!titleEn || !titleAr || !taglineEn || !taglineAr || !articleEn || !articleAr) {
    return json({ ok: false, error: 'Title, tagline, and article are required in both languages.' }, 400);
  }
  if (videoUrl) {
    try {
      new URL(videoUrl);
    } catch {
      return json({ ok: false, error: 'Video URL is not valid.' }, 400);
    }
  }

  const files = formData.getAll('images').filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) {
    return json({ ok: false, error: 'At least one photo is required.' }, 400);
  }

  const images: { buffer: Buffer; ext: string }[] = [];
  for (const file of files) {
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return json({ ok: false, error: 'Each image must be under 5MB.' }, 400);
    }
    const ext = ALLOWED_IMAGE_TYPES[file.type];
    if (!ext) {
      return json({ ok: false, error: 'Only JPG, PNG, or WebP images are allowed.' }, 400);
    }
    images.push({ buffer: Buffer.from(await file.arrayBuffer()), ext });
  }

  const fields: ProductTextFields = { titleEn, titleAr, taglineEn, taglineAr, articleEn, articleAr, videoUrl };
  const product = await addProduct(fields, images);

  return json({ ok: true, item: product }, 201);
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
