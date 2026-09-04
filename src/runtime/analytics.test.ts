import { beforeEach, describe, expect, it } from 'vitest'
import { disableAnalytics, enableAnalytics } from './analytics'

describe('disableAnalytics', () => {
  beforeEach(() => {
    delete (window as any)['ga-disable-G-TEST']
  })

  it('sets the ga-disable flag for the given id', () => {
    disableAnalytics('G-TEST')

    expect((window as any)['ga-disable-G-TEST']).toBe(true)
  })
})

describe('enableAnalytics', () => {
  it('removes a previously set ga-disable flag', () => {
    (window as any)['ga-disable-G-TEST'] = true

    enableAnalytics('G-TEST')

    expect('ga-disable-G-TEST' in window).toBe(false)
  })

  it('is a no-op when the flag was never set', () => {
    delete (window as any)['ga-disable-G-TEST']

    expect(() => enableAnalytics('G-TEST')).not.toThrow()
    expect('ga-disable-G-TEST' in window).toBe(false)
  })
})
