import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';

// Resolved against the process cwd, which is the project root both in `astro dev`
// and when running the built standalone server via `node ./dist/server/entry.mjs`
// from the project directory (see README for the deploy command).
const ROOT = process.cwd();
const REQUESTS_PATH = path.join(ROOT, 'src/data/requests.json');
const PORTFOLIO_JSON_PATH = path.join(ROOT, 'src/content/portfolio/portfolio.json');
const PORTFOLIO_IMAGES_DIR = path.join(ROOT, 'public/portfolio');

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
  imagePath: string;
  descriptionEn: string;
  descriptionAr: string;
  date: string;
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
  item: Omit<PortfolioItem, 'id' | 'imagePath'>,
  imageBuffer: Buffer,
  imageExt: string
): Promise<PortfolioItem> {
  await mkdir(PORTFOLIO_IMAGES_DIR, { recursive: true });
  const id = Date.now().toString();
  const filename = `${id}${imageExt}`;
  await writeFile(path.join(PORTFOLIO_IMAGES_DIR, filename), imageBuffer);

  const newItem: PortfolioItem = {
    id,
    imagePath: `/portfolio/${filename}`,
    ...item,
  };

  const items = await getPortfolioItems();
  items.push(newItem);
  await writeJson(PORTFOLIO_JSON_PATH, items);
  return newItem;
}

export async function deletePortfolioItem(id: string): Promise<boolean> {
  const items = await getPortfolioItems();
  const index = items.findIndex((i) => i.id === id);
  if (index === -1) return false;

  const [removed] = items.splice(index, 1);
  await writeJson(PORTFOLIO_JSON_PATH, items);

  try {
    await unlink(path.join(ROOT, 'public', removed.imagePath.replace(/^\//, '')));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
  }

  return true;
}
