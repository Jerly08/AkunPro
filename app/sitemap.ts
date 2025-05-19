import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://akunpro.com'
  
  // Main pages
  const routes = [
    '',
    '/about',
    '/contact',
    '/netflix',
    '/spotify',
    '/cart',
    '/checkout',
    '/dashboard',
    '/profile',
    '/orders',
    '/help',
  ].map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  return routes
} 