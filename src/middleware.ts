import { defineMiddleware } from 'astro:middleware';

const COOKIE_NAME = 'lg_partner';
const MAX_AGE_DAYS = 30;
const MAX_AGE_SECONDS = MAX_AGE_DAYS * 24 * 60 * 60;

export const onRequest = defineMiddleware(async (context, next) => {
  const url = context.url;
  const pathname = url.pathname;
  if (pathname.startsWith('/api/') || pathname.startsWith('/access/') || pathname.startsWith('/_astro/')) {
    return next();
  }

  const partnerFromQuery = url.searchParams.get('p');
  if (partnerFromQuery && /^[a-z0-9][a-z0-9-]{2,40}$/i.test(partnerFromQuery)) {
    context.cookies.set(COOKIE_NAME, partnerFromQuery, {
      path: '/',
      maxAge: MAX_AGE_SECONDS,
      sameSite: 'lax',
      secure: import.meta.env.PROD,
      httpOnly: false,
    });
  }

  return next();
});
