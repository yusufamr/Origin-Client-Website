import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';

// Resolved against the process cwd, which is the project root both in `astro dev`
// and when running the built standalone server via `node ./dist/server/entry.mjs`
// from the project directory (see README for the deploy command).
const ROOT = process.cwd();
const REQUESTS_PATH = path.join(ROOT, 'src/data/requests.json');
const PORTFOLIO_JSON_PATH = path.join(ROOT, 'src/content/portfolio/portfolio.json');
const PORTFOLIO_IMAGES_DIR = path.join(ROOT, 'public/portfolio');
const PRODUCTS_JSON_PATH = path.join(ROOT, 'src/content/products/products.json');
const PRODUCTS_IMAGES_DIR = path.join(ROOT, 'public/products');

export interface CallRequest {
  id: string;
  name: string;
  phone: string;
  time: 'any' | 'morning' | 'afternoon' | 'evening';
  timestamp: string;
  contacted: boolean;
}

export interface PortfolioItem {
  id: string;
  images: string[];
  descriptionEn: string;
  descriptionAr: string;
  date: string;
}

export type PortfolioTextFields = Pick<PortfolioItem, 'descriptionEn' | 'descriptionAr' | 'date'>;

export interface Product {
  id: string;
  slug: string;
  titleEn: string;
  titleAr: string;
  taglineEn: string;
  taglineAr: string;
  articleEn: string;
  articleAr: string;
  videoUrl: string;
  images: string[];
  order: number;
}

export type ProductTextFields = Pick<
  Product,
  'titleEn' | 'titleAr' | 'taglineEn' | 'taglineAr' | 'articleEn' | 'articleAr' | 'videoUrl'
>;

interface ImageUpload {
  buffer: Buffer;
  ext: string;
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return fallback;
    throw err;
  }
}

async function writeJson(filePath: string, data: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

export async function getRequests(): Promise<CallRequest[]> {
  return readJson<CallRequest[]>(REQUESTS_PATH, []);
}

export async function appendRequest(entry: CallRequest): Promise<void> {
  const requests = await getRequests();
  requests.push(entry);
  await writeJson(REQUESTS_PATH, requests);
}

export async function setRequestContacted(id: string, contacted: boolean): Promise<boolean> {
  const requests = await getRequests();
  const item = requests.find((r) => r.id === id);
  if (!item) return false;
  item.contacted = contacted;
  await writeJson(REQUESTS_PATH, requests);
  return true;
}

export async function getPortfolioItems(): Promise<PortfolioItem[]> {
  return readJson<PortfolioItem[]>(PORTFOLIO_JSON_PATH, []);
}

export async function addPortfolioItem(
  fields: PortfolioTextFields,
  images: ImageUpload[]
): Promise<PortfolioItem> {
  await mkdir(PORTFOLIO_IMAGES_DIR, { recursive: true });
  const id = Date.now().toString();

  const imagePaths: string[] = [];
  for (const [i, image] of images.entries()) {
    const filename = `${id}-${i}${image.ext}`;
    await writeFile(path.join(PORTFOLIO_IMAGES_DIR, filename), image.buffer);
    imagePaths.push(`/portfolio/${filename}`);
  }

  const newItem: PortfolioItem = { id, images: imagePaths, ...fields };

  const items = await getPortfolioItems();
  items.push(newItem);
  await writeJson(PORTFOLIO_JSON_PATH, items);
  return newItem;
}

export async function updatePortfolioItem(
  id: string,
  fields: PortfolioTextFields,
  newImages: ImageUpload[],
  removeImagePaths: string[]
): Promise<PortfolioItem | null> {
  const items = await getPortfolioItems();
  const index = items.findIndex((i) => i.id === id);
  if (index === -1) return null;

  const item = items[index];
  Object.assign(item, fields);

  if (removeImagePaths.length) {
    item.images = item.images.filter((img) => !removeImagePaths.includes(img));
    for (const imgPath of removeImagePaths) {
      await unlinkPublicFile(imgPath);
    }
  }

  if (newImages.length) {
    await mkdir(PORTFOLIO_IMAGES_DIR, { recursive: true });
    for (const [i, image] of newImages.entries()) {
      const filename = `${id}-${Date.now()}-${i}${image.ext}`;
      await writeFile(path.join(PORTFOLIO_IMAGES_DIR, filename), image.buffer);
      item.images.push(`/portfolio/${filename}`);
    }
  }

  items[index] = item;
  await writeJson(PORTFOLIO_JSON_PATH, items);
  return item;
}

export async function deletePortfolioItem(id: string): Promise<boolean> {
  const items = await getPortfolioItems();
  const index = items.findIndex((i) => i.id === id);
  if (index === -1) return false;

  const [removed] = items.splice(index, 1);
  await writeJson(PORTFOLIO_JSON_PATH, items);

  for (const imgPath of removed.images) {
    await unlinkPublicFile(imgPath);
  }

  return true;
}

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'product'
  );
}

function uniqueSlug(base: string, existing: Product[]): string {
  const baseSlug = slugify(base);
  let slug = baseSlug;
  let n = 2;
  while (existing.some((p) => p.slug === slug)) {
    slug = `${baseSlug}-${n++}`;
  }
  return slug;
}

async function unlinkPublicFile(publicPath: string): Promise<void> {
  try {
    await unlink(path.join(ROOT, 'public', publicPath.replace(/^\//, '')));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
  }
}

export async function getProducts(): Promise<Product[]> {
  const items = await readJson<Product[]>(PRODUCTS_JSON_PATH, []);
  return items.sort((a, b) => a.order - b.order);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const items = await getProducts();
  return items.find((p) => p.slug === slug);
}

export async function addProduct(fields: ProductTextFields, images: ImageUpload[]): Promise<Product> {
  await mkdir(PRODUCTS_IMAGES_DIR, { recursive: true });
  const items = await getProducts();
  const id = Date.now().toString();
  const slug = uniqueSlug(fields.titleEn, items);

  const imagePaths: string[] = [];
  for (const [i, image] of images.entries()) {
    const filename = `${id}-${i}${image.ext}`;
    await writeFile(path.join(PRODUCTS_IMAGES_DIR, filename), image.buffer);
    imagePaths.push(`/products/${filename}`);
  }

  const order = items.length ? Math.max(...items.map((p) => p.order)) + 1 : 1;
  const newProduct: Product = { id, slug, images: imagePaths, order, ...fields };

  items.push(newProduct);
  await writeJson(PRODUCTS_JSON_PATH, items);
  return newProduct;
}

export async function updateProduct(
  id: string,
  fields: ProductTextFields,
  newImages: ImageUpload[],
  removeImagePaths: string[]
): Promise<Product | null> {
  const items = await getProducts();
  const index = items.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const product = items[index];
  Object.assign(product, fields);

  if (removeImagePaths.length) {
    product.images = product.images.filter((img) => !removeImagePaths.includes(img));
    for (const imgPath of removeImagePaths) {
      await unlinkPublicFile(imgPath);
    }
  }

  if (newImages.length) {
    await mkdir(PRODUCTS_IMAGES_DIR, { recursive: true });
    for (const [i, image] of newImages.entries()) {
      const filename = `${id}-${Date.now()}-${i}${image.ext}`;
      await writeFile(path.join(PRODUCTS_IMAGES_DIR, filename), image.buffer);
      product.images.push(`/products/${filename}`);
    }
  }

  items[index] = product;
  await writeJson(PRODUCTS_JSON_PATH, items);
  return product;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const items = await getProducts();
  const index = items.findIndex((p) => p.id === id);
  if (index === -1) return false;

  const [removed] = items.splice(index, 1);
  await writeJson(PRODUCTS_JSON_PATH, items);

  for (const imgPath of removed.images) {
    await unlinkPublicFile(imgPath);
  }

  return true;
}

export async function reorderProduct(id: string, direction: 'up' | 'down'): Promise<boolean> {
  const items = await getProducts();
  const index = items.findIndex((p) => p.id === id);
  if (index === -1) return false;

  const swapIndex = direction === 'up' ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= items.length) return false;

  const currentOrder = items[index].order;
  items[index].order = items[swapIndex].order;
  items[swapIndex].order = currentOrder;

  await writeJson(PRODUCTS_JSON_PATH, items);
  return true;
}
