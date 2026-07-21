const FALLBACK_ORIGIN = 'https://chat.local'

const SAFE_LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:'])
const SAFE_RESOURCE_PROTOCOLS = new Set(['http:', 'https:', 'blob:'])
const SAFE_DATA_MEDIA_TYPES = new Set([
  'application/pdf',
  'audio/mpeg',
  'audio/ogg',
  'audio/wav',
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/csv',
  'text/plain',
  'video/mp4',
  'video/webm',
])

function getBaseOrigin() {
  return typeof window === 'undefined' ? FALLBACK_ORIGIN : window.location.origin
}

function parseUrl(value: string) {
  try {
    return new URL(value, getBaseOrigin())
  } catch {
    return undefined
  }
}

/** Returns the original URL only when it is safe for a source/navigation link. */
export function getSafeLinkUrl(value: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined

  const parsed = parseUrl(trimmed)
  if (!parsed || !SAFE_LINK_PROTOCOLS.has(parsed.protocol)) return undefined
  return trimmed
}

/**
 * Returns the original URL only when it is safe to render as a file resource.
 * Data URLs are limited to an explicit non-active-content media-type allowlist;
 * SVG/HTML/XML are deliberately excluded.
 */
export function getSafeResourceUrl(
  value: string,
  mediaType: string,
): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined

  const parsed = parseUrl(trimmed)
  if (!parsed) return undefined
  if (SAFE_RESOURCE_PROTOCOLS.has(parsed.protocol)) return trimmed
  if (parsed.protocol !== 'data:') return undefined

  const normalizedMediaType = mediaType.split(';', 1)[0]?.trim().toLowerCase()
  if (!normalizedMediaType || !SAFE_DATA_MEDIA_TYPES.has(normalizedMediaType)) {
    return undefined
  }

  return trimmed.toLowerCase().startsWith(`data:${normalizedMediaType}`)
    ? trimmed
    : undefined
}
