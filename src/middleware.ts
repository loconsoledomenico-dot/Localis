import { defineMiddleware } from 'astro:middleware';
import {
  LANG_COOKIE_NAME,
  allLangUrls,
  getPathLang,
  getPreferredLangFromHeader,
  isPublicHtmlPath,
  isSupportedLang,
} from './lib/i18n';

const PARTNER_COOKIE_NAME = 'lg_partner';
const MAX_AGE_DAYS = 30;
const MAX_AGE_SECONDS = MAX_AGE_DAYS * 24 * 60 * 60;

export const onRequest = defineMiddleware(async (context, next) => {
  const url = context.url;
  const pathname = url.pathname;
  if (!['GET', 'HEAD'].includes(context.request.method) || !isPublicHtmlPath(pathname)) {
    return next();
  }

  const cookieOptions = {
    path: '/',
    maxAge: MAX_AGE_SECONDS,
    sameSite: 'lax' as const,
    secure: import.meta.env.PROD,
    httpOnly: false,
  };

  const partnerFromQuery = url.searchParams.get('p');
  if (partnerFromQuery && /^[a-z0-9][a-z0-9-]{2,40}$/i.test(partnerFromQuery)) {
    context.cookies.set(PARTNER_COOKIE_NAME, partnerFromQuery, cookieOptions);
  }

  const queryLang = url.searchParams.get('lang');
  if (isSupportedLang(queryLang)) {
    context.cookies.set(LANG_COOKIE_NAME, queryLang, cookieOptions);
  }

  const redirectTo = (targetPath: string) => {
    const redirectUrl = new URL(url);
    redirectUrl.pathname = targetPath;
    redirectUrl.searchParams.delete('lang');
    return context.redirect(redirectUrl.toString(), 302);
  };

  // I QR partner puntano alla landing /p/{slug} (ripristino 2026-06-12: i
  // vecchi redirect verso la home disperdevano il traffico). Le landing sono
  // prerenderizzate, quindi questo set serve solo ai path serviti dalla
  // function; sul percorso statico il cookie lo mette il client (Layout) e
  // al checkout c'è comunque il partnerId nel payload.
  const partnerPathMatch = pathname.match(/^\/(?:(it|en|de)\/)?p\/([a-z0-9][a-z0-9-]{2,40})\/?$/i);
  if (partnerPathMatch) {
    context.cookies.set(PARTNER_COOKIE_NAME, partnerPathMatch[2], cookieOptions);
  }

  if (isSupportedLang(queryLang)) {
    const targetPath = allLangUrls(pathname)[queryLang];
    if (targetPath !== pathname || url.searchParams.has('lang')) {
      return redirectTo(targetPath);
    }
    return next();
  }

  const pathLang = getPathLang(pathname);
  if (pathLang) {
    context.cookies.set(LANG_COOKIE_NAME, pathLang, cookieOptions);
    return next();
  }

  const cookieLang = context.cookies.get(LANG_COOKIE_NAME)?.value;
  const preferredLang = isSupportedLang(cookieLang)
    ? cookieLang
    : getPreferredLangFromHeader(context.request.headers.get('accept-language'));

  if (preferredLang !== 'it') {
    context.cookies.set(LANG_COOKIE_NAME, preferredLang, cookieOptions);
    return redirectTo(allLangUrls(pathname)[preferredLang]);
  }

  return next();
});
