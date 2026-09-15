export function getStorefrontUrl(slug: string, absolute = false) {
  const path = `/s/${encodeURIComponent(slug)}`
  return absolute ? `https://www.vendari.name.ng${path}` : path
}

export function getStorefrontCartKey(slug: string) {
  return `vendari-storefront-cart:${slug}`
}