import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const guides = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/guides' }),
  schema: z.object({
    slug: z.string(),
    city: z.enum([
      'bari',
      'polignano',
      'ostuni',
      'lecce',
      'matera',
      'trani',
      'otranto',
      'gallipoli',
      'alberobello',
      'vieste',
    ]),
    title_it: z.string(),
    title_en: z.string(),
    subtitle_it: z.string(),
    subtitle_en: z.string(),
    duration_seconds: z.number().int().positive(),
    cover: z.string(),
    audio_full_key_it: z.string(),
    audio_full_key_en: z.string(),
    audio_trailer_path: z.string(),
    chapters: z
      .array(
        z.object({
          title_it: z.string(),
          title_en: z.string(),
          start_seconds: z.number().int().nonnegative(),
        }),
      )
      .min(1),
    coords_start: z
      .object({
        lat: z.number(),
        lng: z.number(),
      })
      .optional(),
    price_cents: z.number().int().default(499),
    status: z.enum(['live', 'soon', 'archived']).default('live'),
    published_at: z.date(),
    seo: z.object({
      description_it: z.string().max(160),
      description_en: z.string().max(160),
    }),
  }),
});

const partners = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/partners' }),
  schema: z.object({
    slug: z.string(),
    display_name: z.string(),
    type: z.enum(['hotel', 'bb', 'bar', 'restaurant', 'shop', 'other']),
    city: z.string(),
    contact_email: z.string().email(),
    stripe_account_id: z.string().regex(/^acct_/),
    commission_rate: z.number().min(0).max(0.5).default(0.25),
    created_at: z.date(),
    status: z.enum(['active', 'paused', 'terminated']),
    custom_landing_copy_it: z.string().optional(),
    custom_landing_copy_en: z.string().optional(),
  }),
});

export const collections = { guides, partners };
