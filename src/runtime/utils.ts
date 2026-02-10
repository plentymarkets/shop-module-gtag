import type { GoogleTagOptions } from './types'

export const CookieName = 'CookieBar.moduleGoogleAnalytics.googleAnalytics'

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
export function gtag(...args: any[]) {
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer?.push(arguments)
}

/**
 * Initialize the Google tag.
 */
export function initGtag(tag: GoogleTagOptions) {
  window.dataLayer = window.dataLayer || []

  for (const command of tag.initCommands ?? [])
    gtag(...command)

  gtag('js', new Date())
  gtag('config', tag.id, tag.config ?? {})
}

/**
 * Helper to convert both '1'/'0' and 'true'/'false' to boolean
 */
const toBool = (val?: string): boolean => {
  return val === '1' || val === 'true'
}

/**
 * Resolve environment variables with fallback to legacy names
 * Supports both new (NUXT_PUBLIC_*) and legacy (PWA_MODULE_GA_*) env vars
 */
export function resolveEnvConfig() {
  if
  (
    process.env.PWA_MODULE_GA_ID
    || process.env.PWA_MODULE_GA_ENABLED
    || process.env.PWA_MODULE_GA_SHOW_GROSS_PRICE
    || process.env.PWA_MODULE_GA_OPT_OUT
    || process.env.PWA_MODULE_GA_COOKIE_GROUP
  ) {
    console.warn(
      '[pwa-module-gtag] DEPRECATED: PWA_MODULE_GA_* env vars are deprecated. Please use NUXT_PUBLIC_* env vars instead.',
    )
  }

  return {
    id:
      process.env.PWA_MODULE_GA_ID || process.env.NUXT_PUBLIC_GOOGLE_ANALITICS_TRACKING_ID,
    enabled:
      toBool(process.env.PWA_MODULE_GA_ENABLED) || toBool(process.env.NUXT_PUBLIC_ENABLE_GOOGLE_ANALITICS),
    showGrossPrices:
      toBool(process.env.PWA_MODULE_GA_SHOW_GROSS_PRICES) || toBool(process.env.NUXT_PUBLIC_SEND_GROSS_PRICES_TO_GOOGLE_ANALITICS),
    cookieOptOut:
      toBool(process.env.PWA_MODULE_GA_OPT_OUT) || toBool(process.env.NUXT_PUBLIC_REGISTER_COOKIE_AS_OPT_OUT),
    cookieGroup:
      process.env.PWA_MODULE_GA_COOKIE_GROUP || process.env.NUXT_PUBLIC_GOOGLE_ANALITICS_COOKIE_GROUP || 'CookieBar.marketing.label',
  }
}
