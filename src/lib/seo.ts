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

export interface GuideLDInput {
  slug: string;
  title: string;
  description: string;
  durationSeconds: number;
  audioUrl?: string;
  language: 'it' | 'en';
  priceCents: number;
  coords?: { lat: number; lng: number };
  cityName?: string;
}

export function audioObjectLD(g: GuideLDInput) {
  const url = `https://localis.guide${g.language === 'en' ? '/en' : ''}/guide/${g.slug}`;
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
