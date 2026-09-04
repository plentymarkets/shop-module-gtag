import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { gtag, hasInitCommands, initGtag, resolveEnvConfig } from './utils'

describe('gtag', () => {
  afterEach(() => {
    delete (window as any).dataLayer
  })

  it('pushes the call arguments onto window.dataLayer', () => {
    window.dataLayer = []

    gtag('event', 'page_view', { page_path: '/foo' })

    expect(window.dataLayer).toHaveLength(1)
    expect(Array.from(window.dataLayer[0] as any)).toEqual(['event', 'page_view', { page_path: '/foo' }])
  })

  it('does not throw when dataLayer has not been initialized yet', () => {
    delete (window as any).dataLayer

    expect(() => gtag('event', 'page_view')).not.toThrow()
  })
})

describe('initGtag', () => {
  afterEach(() => {
    delete (window as any).dataLayer
  })

  it('initializes window.dataLayer when missing', () => {
    delete (window as any).dataLayer

    initGtag({ id: 'G-TEST' })

    expect(Array.isArray(window.dataLayer)).toBe(true)
  })

  it('does not overwrite an existing dataLayer', () => {
    const existing: any[] = []
    window.dataLayer = existing

    initGtag({ id: 'G-TEST' })

    expect(window.dataLayer).toBe(existing)
  })

  it('replays config.initCommands before the js/config commands', () => {
    window.dataLayer = []

    initGtag({
      id: 'G-TEST',
      config: {
        initCommands: [['consent', 'default', { ad_storage: 'denied', analytics_storage: 'denied' }]],
      },
    })

    const calls = window.dataLayer.map(entry => Array.from(entry as any)) as any[][]
    expect(calls[0]).toEqual(['consent', 'default', { ad_storage: 'denied', analytics_storage: 'denied' }])
    expect(calls[1]?.[0]).toBe('js')
    expect(calls[2]).toEqual(['config', 'G-TEST', {}])
  })

  it('strips initCommands out of the params sent with the config command', () => {
    window.dataLayer = []

    initGtag({
      id: 'G-TEST',
      config: {
        send_page_view: true,
        initCommands: [['consent', 'default', { ad_storage: 'denied' }]],
      },
    })

    const calls = window.dataLayer.map(entry => Array.from(entry as any)) as any[][]
    expect(calls[2]).toEqual(['config', 'G-TEST', { send_page_view: true }])
  })

  it('runs js/config commands with no initCommands set', () => {
    window.dataLayer = []

    initGtag({ id: 'G-TEST', config: { send_page_view: false } })

    const calls = window.dataLayer.map(entry => Array.from(entry as any)) as any[][]
    expect(calls).toHaveLength(2)
    expect(calls[0]?.[0]).toBe('js')
    expect(calls[1]).toEqual(['config', 'G-TEST', { send_page_view: false }])
  })
})

describe('hasInitCommands', () => {
  it('is true when config.initCommands has entries', () => {
    expect(hasInitCommands({ initCommands: [['consent', 'default', { ad_storage: 'denied' }]] })).toBe(true)
  })

  it('is false when config.initCommands is missing, empty, or config itself is undefined', () => {
    expect(hasInitCommands(undefined)).toBe(false)
    expect(hasInitCommands({})).toBe(false)
    expect(hasInitCommands({ initCommands: [] })).toBe(false)
  })
})

describe('resolveEnvConfig', () => {
  const envKeys = [
    'PWA_MODULE_GA_ID',
    'PWA_MODULE_GA_ENABLED',
    'PWA_MODULE_GA_SHOW_GROSS_PRICES',
    'PWA_MODULE_GA_OPT_OUT',
    'PWA_MODULE_GA_COOKIE_GROUP',
    'NUXT_PUBLIC_GOOGLE_ANALITICS_TRACKING_ID',
    'NUXT_PUBLIC_ENABLE_GOOGLE_ANALITICS',
    'NUXT_PUBLIC_SEND_GROSS_PRICES_TO_GOOGLE_ANALITICS',
    'NUXT_PUBLIC_REGISTER_COOKIE_AS_OPT_OUT',
    'NUXT_PUBLIC_GOOGLE_ANALITICS_COOKIE_GROUP',
  ] as const

  beforeEach(() => {
    for (const key of envKeys) delete process.env[key]
  })

  afterEach(() => {
    for (const key of envKeys) delete process.env[key]
    vi.restoreAllMocks()
  })

  it('falls back to defaults when nothing is set', () => {
    expect(resolveEnvConfig()).toEqual({
      id: undefined,
      enabled: false,
      showGrossPrices: false,
      cookieOptOut: false,
      cookieGroup: 'CookieBar.marketing.label',
    })
  })

  it('reads the new NUXT_PUBLIC_* vars', () => {
    process.env.NUXT_PUBLIC_GOOGLE_ANALITICS_TRACKING_ID = 'G-NEW'
    process.env.NUXT_PUBLIC_ENABLE_GOOGLE_ANALITICS = 'true'
    process.env.NUXT_PUBLIC_SEND_GROSS_PRICES_TO_GOOGLE_ANALITICS = '1'
    process.env.NUXT_PUBLIC_REGISTER_COOKIE_AS_OPT_OUT = 'true'
    process.env.NUXT_PUBLIC_GOOGLE_ANALITICS_COOKIE_GROUP = 'custom.group'

    expect(resolveEnvConfig()).toEqual({
      id: 'G-NEW',
      enabled: true,
      showGrossPrices: true,
      cookieOptOut: true,
      cookieGroup: 'custom.group',
    })
  })

  it('prefers legacy PWA_MODULE_GA_* vars over the new ones when both are set', () => {
    process.env.PWA_MODULE_GA_ID = 'G-LEGACY'
    process.env.NUXT_PUBLIC_GOOGLE_ANALITICS_TRACKING_ID = 'G-NEW'
    process.env.PWA_MODULE_GA_ENABLED = '1'
    process.env.NUXT_PUBLIC_ENABLE_GOOGLE_ANALITICS = 'false'

    const result = resolveEnvConfig()
    expect(result.id).toBe('G-LEGACY')
    expect(result.enabled).toBe(true)
  })

  it('coerces "0"/"false"/unset to false', () => {
    process.env.PWA_MODULE_GA_ENABLED = '0'
    expect(resolveEnvConfig().enabled).toBe(false)

    process.env.PWA_MODULE_GA_ENABLED = 'false'
    expect(resolveEnvConfig().enabled).toBe(false)
  })

  it('warns once when any legacy env var is set', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    process.env.PWA_MODULE_GA_COOKIE_GROUP = 'legacy.group'
    resolveEnvConfig()

    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]?.[0]).toContain('DEPRECATED')
  })

  it('does not warn when only new env vars are set', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    process.env.NUXT_PUBLIC_GOOGLE_ANALITICS_COOKIE_GROUP = 'new.group'
    resolveEnvConfig()

    expect(warn).not.toHaveBeenCalled()
  })
})
