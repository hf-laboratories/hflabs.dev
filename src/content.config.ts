import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const docs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/docs' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    order: z.number().default(99),
    badge: z.string().optional(),
    tags: z.array(z.string()).default([])
  })
});

const book = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/book' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional().default(''),
    part: z.string().optional().default('Part I — Production Readiness'),
    chapter: z.string().optional(),
    order: z.number().default(99),
    category: z.string().optional().default('General'),
    filename: z.string().optional(),
    tags: z.array(z.string()).default([])
  })
});

export const collections = { docs, book };
