import type {MetadataRoute} from 'next';

import {locales} from '@/i18n/routing';
import {localizePath, localeRoutes} from '@/lib/routes';

const siteUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://capyra.co';
const routes = [localeRoutes.home, localeRoutes.integracoes] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return locales.flatMap((locale) =>
    routes.map((route) => ({
      url: new URL(localizePath(locale, route), siteUrl).href
    }))
  );
}
