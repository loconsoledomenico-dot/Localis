import type { CollectionEntry } from 'astro:content';
import type { Lang } from './i18n';

type GuideData = CollectionEntry<'guides'>['data'];
type GuideChapter = GuideData['chapters'][number];

function positiveOrUndefined(value: number | undefined): number | undefined {
  return value && value > 0 ? value : undefined;
}

export function guideTitle(data: GuideData, lang: Lang): string {
  if (lang === 'de') return data.title_de ?? data.title_en;
  if (lang === 'en') return data.title_en;
  return data.title_it;
}

export function guideSubtitle(data: GuideData, lang: Lang): string {
  if (lang === 'de') return data.subtitle_de ?? data.subtitle_en;
  if (lang === 'en') return data.subtitle_en;
  return data.subtitle_it;
}

export function guideDescription(data: GuideData, lang: Lang): string {
  if (lang === 'de') return data.seo.description_de ?? data.seo.description_en;
  if (lang === 'en') return data.seo.description_en;
  return data.seo.description_it;
}

export function guideDurationSeconds(data: GuideData, lang: Lang): number {
  if (lang === 'de') {
    return positiveOrUndefined(data.duration_seconds_de)
      ?? positiveOrUndefined(data.duration_seconds_en)
      ?? data.duration_seconds;
  }
  if (lang === 'en') return positiveOrUndefined(data.duration_seconds_en) ?? data.duration_seconds;
  return data.duration_seconds;
}

export function narratorBio(data: GuideData, lang: Lang): string | undefined {
  if (!data.narrator) return undefined;
  if (lang === 'de') return data.narrator.bio_de ?? data.narrator.bio_en;
  if (lang === 'en') return data.narrator.bio_en;
  return data.narrator.bio_it;
}

export function chapterTitle(chapter: GuideChapter, lang: Lang): string {
  if (lang === 'de') return chapter.title_de ?? chapter.title_en;
  if (lang === 'en') return chapter.title_en;
  return chapter.title_it;
}

export function chapterStartSeconds(chapter: GuideChapter, lang: Lang): number {
  if (lang === 'de') {
    return positiveOrUndefined(chapter.start_seconds_de)
      ?? positiveOrUndefined(chapter.start_seconds_en)
      ?? chapter.start_seconds;
  }
  if (lang === 'en') return positiveOrUndefined(chapter.start_seconds_en) ?? chapter.start_seconds;
  return chapter.start_seconds;
}

export function guideStopsCount(data: GuideData): number {
  return data.stops_count ?? data.chapters.length;
}

export function guideRouteMode(data: GuideData, lang: Lang): string | undefined {
  if (lang === 'de') return data.route_mode_de ?? data.route_mode_en ?? data.route_mode_it;
  if (lang === 'en') return data.route_mode_en ?? data.route_mode_it;
  return data.route_mode_it;
}

export function guideAccessibility(data: GuideData, lang: Lang): string | undefined {
  if (lang === 'de') return data.accessibility_de ?? data.accessibility_en ?? data.accessibility_it;
  if (lang === 'en') return data.accessibility_en ?? data.accessibility_it;
  return data.accessibility_it;
}

export function guideNeeds(data: GuideData, lang: Lang): string | undefined {
  if (lang === 'de') return data.needs_de ?? data.needs_en ?? data.needs_it;
  if (lang === 'en') return data.needs_en ?? data.needs_it;
  return data.needs_it;
}
