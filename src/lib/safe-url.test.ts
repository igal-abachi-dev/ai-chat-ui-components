import { describe, expect, it } from 'vitest'
import { getSafeLinkUrl, getSafeResourceUrl } from './safe-url'

describe('getSafeLinkUrl', () => {
  it('allows normal web and relative links', () => {
    expect(getSafeLinkUrl('https://example.com/page')).toBe(
      'https://example.com/page',
    )
    expect(getSafeLinkUrl('/files/report')).toBe('/files/report')
  })

  it('blocks executable and data protocols', () => {
    expect(getSafeLinkUrl('javascript:alert(1)')).toBeUndefined()
    expect(getSafeLinkUrl('data:text/html,<script>alert(1)</script>')).toBeUndefined()
  })
})

describe('getSafeResourceUrl', () => {
  it('allows web, blob, and approved data resources', () => {
    expect(getSafeResourceUrl('blob:https://example.com/id', 'image/png')).toBe(
      'blob:https://example.com/id',
    )
    expect(getSafeResourceUrl('data:image/png;base64,AAAA', 'image/png')).toBe(
      'data:image/png;base64,AAAA',
    )
  })

  it('blocks active data content and mismatched declared types', () => {
    expect(
      getSafeResourceUrl('data:image/svg+xml,<svg/>', 'image/svg+xml'),
    ).toBeUndefined()
    expect(
      getSafeResourceUrl('data:text/html,<script/>', 'text/html'),
    ).toBeUndefined()
    expect(
      getSafeResourceUrl('data:text/html,hello', 'text/plain'),
    ).toBeUndefined()
  })
})
