import type { Lang } from './i18n';

export function organizationLD() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Localis',
    url: 'https://localis.guide',
    logo: 'https://localis.guide/favicon.svg',
    founder: [
      { '@type': 'Person', name: 'Domenico Loconsole' },
      { '@type': 'Person', name: 'Luigi Loconsole' },
    ],
    description: 'Audioguide narrative della Puglia. Storie vere, senza app.',
  };
}

export function breadcrumbListLD(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function faqPageLD(questions: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function itemListLD(name: string, itemUrls: string[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    itemListElement: itemUrls.map((url, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url,
    })),
  };
}

export interface GuideLDInput {
  slug: string;
  title: string;
  description: string;
  durationSeconds: number;
  audioUrl?: string;
  language: Lang;
  priceCents: number;
  coords?: { lat: number; lng: number };
  cityName?: string;
}

export function audioObjectLD(g: GuideLDInput) {
  const url = `https://localis.guide${g.language === 'en' ? '/en' : g.language === 'de' ? '/de' : ''}/guide/${g.slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'AudioObject',
    name: g.title,
    description: g.description,
    url,
    duration: `PT${Math.floor(g.durationSeconds / 60)}M${g.durationSeconds % 60}S`,
    encodingFormat: 'audio/mpeg',
    inLanguage: g.language,
    author: { '@type': 'Person', name: 'Domenico Loconsole' },
    publisher: organizationLD(),
    offers: {
      '@type': 'Offer',
      price: (g.priceCents / 100).toFixed(2),
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      url,
    },
  };
}

export interface ProductLDInput {
  slug: string;
  title: string;
  description: string;
  cover: string;
  priceCents: number;
  language: Lang;
}

export function productLD(g: ProductLDInput) {
  const url = `https://localis.guide${g.language === 'en' ? '/en' : g.language === 'de' ? '/de' : ''}/guide/${g.slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: g.title,
    description: g.description,
    image: `https://localis.guide${g.cover}`,
    url,
    brand: { '@type': 'Brand', name: 'Localis' },
    offers: {
      '@type': 'Offer',
      price: (g.priceCents / 100).toFixed(2),
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      url,
    },
  };
}

export function touristAttractionLD(name: string, coords: { lat: number; lng: number }, city: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: coords.lat,
      longitude: coords.lng,
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: city,
      addressRegion: 'Puglia',
      addressCountry: 'IT',
    },
  };
}
