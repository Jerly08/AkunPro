import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/api/',
        '/dashboard/admin',
        '/private/',
      ],
    },
    sitemap: 'https://akunpro.com/sitemap.xml',
  }
} 