import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const products = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/products' }),
  schema: ({ image }) =>
    z.object({
      // Matches the service key used across the i18n dictionaries and icons map.
      productSlug: z.enum(['windows', 'shower-cabins', 'shutters']),
      lang: z.enum(['ar', 'en']),
      title: z.string(),
      tagline: z.string(),
      metaDescription: z.string(),
      videoUrl: z.string().url(),
      order: z.number().default(0),
      images: z.array(
        z.object({
          src: image(),
          alt: z.string(),
        })
      ),
    }),
});

export const collections = { products };
