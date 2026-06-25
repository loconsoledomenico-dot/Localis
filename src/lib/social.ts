// Link social Localis. Riempi questi due valori e il "ponte QR -> follower"
// (componente FollowCta) appare da solo sulle pagine post-scan (/p/[slug]) e
// post-ascolto (/access/[token]). Lasciati vuoti = nessun CTA mostrato (deploy-safe).
// NON inventare handle. Esempi:
//   instagram: 'https://www.instagram.com/<handle>/'
//   fbGroup:   'https://www.facebook.com/groups/<id>'
export const SOCIAL: { instagram: string; fbGroup: string } = {
  instagram: 'https://www.instagram.com/localis.guide/',
  fbGroup: 'https://www.facebook.com/groups/1006410385640244',
};

export const hasSocial = (): boolean => Boolean(SOCIAL.instagram || SOCIAL.fbGroup);
