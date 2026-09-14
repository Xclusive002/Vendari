export function getStorefrontUrl(slug: string) {
  return `/s/${encodeURIComponent(slug)}`
}