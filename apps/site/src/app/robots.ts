import type {MetadataRoute} from 'next';

const siteUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://capyra.co';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/'
    },
    sitemap: `${siteUrl}/sitemap.xml`
  };
}
