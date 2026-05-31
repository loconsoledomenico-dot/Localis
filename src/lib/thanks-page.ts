import type { CollectionEntry } from 'astro:content';
import { formatDuration } from './format';
import type { Lang } from './i18n';
import { guideDurationSeconds, guideSubtitle, guideTitle } from './guide-localization';

type GuideEntry = CollectionEntry<'guides'>;

export type ThanksPageModelState = 'ready' | 'fallback';

export interface ThanksPageCard {
  slug: string;
  title: string;
  subtitle: string;
  duration: string;
  cover: string;
  ctaHref: string;
}

export interface ThanksPageModel {
  state: ThanksPageModelState;
  pageTitle: string;
  primaryMessage: string;
  emailMessage: string;
  cardCta: string;
  cards: ThanksPageCard[];
}

export interface BuildThanksPageModelInput {
  lang: Lang;
  token: string | null;
  buyerEmail: string | null;
  guideSlugs: string[];
  matchedGuides: GuideEntry[];
}

const COPY = {
  it: {
    ready: {
      pageTitle: 'Le tue guide sono pronte.',
      primaryMessage: 'Apri subito le audioguide che hai acquistato.',
      emailMessage: (buyerEmail: string | null) =>
        buyerEmail
          ? `Ti abbiamo inviato il link di accesso a ${buyerEmail}.`
          : 'Ti inviamo subito il link di accesso via email. Controlla anche la cartella spam.',
    },
    empty: {
      pageTitle: 'Grazie.',
      primaryMessage: 'Abbiamo ricevuto il pagamento, ma al momento non riusciamo a caricare le guide acquistate.',
      emailMessage: 'Ti inviamo subito il link di accesso via email. Controlla anche la cartella spam.',
    },
    cardCta: 'Ascolta ora',
  },
  en: {
    ready: {
      pageTitle: 'Your guides are ready.',
      primaryMessage: 'Open your purchased audio guides right away.',
      emailMessage: (buyerEmail: string | null) =>
        buyerEmail
          ? `We sent the access link to ${buyerEmail}.`
          : 'We will send your access link by email shortly. Please check spam too.',
    },
    empty: {
      pageTitle: 'Thank you.',
      primaryMessage: 'We received your payment, but we could not load your guides just now.',
      emailMessage: 'We will send your access link by email shortly. Please check spam too.',
    },
    cardCta: 'Listen now',
  },
  de: {
    ready: {
      pageTitle: 'Deine Guides sind bereit.',
      primaryMessage: 'Oeffne jetzt direkt die gekauften Audioguides.',
      emailMessage: (buyerEmail: string | null) =>
        buyerEmail
          ? `Den Zugangslink haben wir an ${buyerEmail} geschickt.`
          : 'Wir senden dir den Zugangslink gleich per E-Mail. Bitte pruefe auch den Spam-Ordner.',
    },
    empty: {
      pageTitle: 'Danke.',
      primaryMessage: 'Wir haben deine Zahlung erhalten, aber konnten gerade keine Guides laden.',
      emailMessage: 'Wir senden dir den Zugangslink gleich per E-Mail. Bitte pruefe auch den Spam-Ordner.',
    },
    cardCta: 'Jetzt anhoeren',
  },
} satisfies Record<
  Lang,
  {
    ready: {
      pageTitle: string;
      primaryMessage: string;
      emailMessage: (buyerEmail: string | null) => string;
    };
    empty: {
      pageTitle: string;
      primaryMessage: string;
      emailMessage: string;
    };
    cardCta: string;
  }
>;

export function buildThanksPageModel({
  lang,
  token,
  buyerEmail,
  guideSlugs,
  matchedGuides,
}: BuildThanksPageModelInput): ThanksPageModel {
  const cards = guideSlugs
    .map((guideSlug) => matchedGuides.find((guide) => guide.data.slug === guideSlug))
    .filter((guide): guide is GuideEntry => Boolean(guide))
    .map((guide) => ({
      slug: guide.data.slug,
      title: guideTitle(guide.data, lang),
      subtitle: guideSubtitle(guide.data, lang),
      duration: formatDuration(guideDurationSeconds(guide.data, lang)),
      cover: guide.data.cover,
      ctaHref: `/access/${token}?lang=${lang}#${guide.data.slug}`,
    }));

  const copy = COPY[lang];

  if (!token || cards.length === 0) {
    return {
      state: 'fallback',
      pageTitle: copy.empty.pageTitle,
      primaryMessage: copy.empty.primaryMessage,
      emailMessage: copy.empty.emailMessage,
      cardCta: copy.cardCta,
      cards,
    };
  }

  return {
    state: 'ready',
    pageTitle: copy.ready.pageTitle,
    primaryMessage: copy.ready.primaryMessage,
    emailMessage: copy.ready.emailMessage(buyerEmail),
    cardCta: copy.cardCta,
    cards,
  };
}
