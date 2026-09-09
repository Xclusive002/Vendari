import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return [
    {
      url: 'https://www.vendari.name.ng',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: 'https://www.vendari.name.ng/pricing',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://www.vendari.name.ng/login',
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: 'https://www.vendari.name.ng/register',
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ]
}
