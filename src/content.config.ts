import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
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
      'locorotondo',
      'martina-franca',
      'cisternino',
      'ostuni',
      'fasano',
      'vieste',
      'gargano',
    ]),
    title_it: z.string(),
    title_en: z.string(),
    title_de: z.string().optional(),
    subtitle_it: z.string(),
    subtitle_en: z.string(),
    subtitle_de: z.string().optional(),
    duration_seconds: z.number().int().nonnegative(),
    duration_seconds_en: z.number().int().nonnegative().optional(),
    duration_seconds_de: z.number().int().nonnegative().optional(),
    cover: z.string(),
    audio_full_key_it: z.string(),
    audio_full_key_en: z.string(),
    audio_full_key_de: z.string().optional(),
    audio_trailer_path: z.string(),
    audio_trailer_path_en: z.string().optional(),
    audio_trailer_path_de: z.string().optional(),
    chapters: z
      .array(
        z.object({
          title_it: z.string(),
          title_en: z.string(),
          title_de: z.string().optional(),
          start_seconds: z.number().int().nonnegative(),
          start_seconds_en: z.number().int().nonnegative().optional(),
          start_seconds_de: z.number().int().nonnegative().optional(),
        }),
      )
      .min(1),
    coords_start: z
      .object({
        lat: z.number(),
        lng: z.number(),
      })
      .optional(),
    narrator: z
      .object({
        name: z.string(),
        photo: z.string(),
        bio_it: z.string(),
        bio_en: z.string(),
        bio_de: z.string().optional(),
      })
      .optional(),
    price_cents: z.number().int().default(499),
    status: z.enum(['live', 'soon', 'archived']).default('live'),
    published_at: z.date(),
    seo: z.object({
      description_it: z.string().max(160),
      description_en: z.string().max(160),
      description_de: z.string().max(160).optional(),
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
    contact_email: z.email(),
    stripe_account_id: z.string().regex(/^acct_/),
    commission_rate: z.number().min(0).max(0.5).default(0.25),
    created_at: z.date(),
    status: z.enum(['active', 'paused', 'terminated']),
    statement_token: z.string().min(8).optional(),
    custom_landing_copy_it: z.string().optional(),
    custom_landing_copy_en: z.string().optional(),
  }),
});

const sourceEntry = z.object({
  type: z.enum(['book', 'academic', 'archive', 'newspaper', 'documentary', 'website']),
  author: z.string().optional(),
  title: z.string(),
  publisher: z.string().optional(),
  year: z.number().int().optional(),
  url: z.url().optional(),
});

const sources = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/sources' }),
  schema: z.object({
    slug: z.string(),
    guide_title_it: z.string(),
    guide_title_en: z.string(),
    last_review: z.date(),
    chapters: z.array(
      z.object({
        title_it: z.string(),
        facts: z.array(
          z.object({
            claim_it: z.string(),
            sources: z.array(sourceEntry).min(1),
          }),
        ).min(1),
      }),
    ).min(1),
  }),
});

export const collections = { guides, partners, sources };
