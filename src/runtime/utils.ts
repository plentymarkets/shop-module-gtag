import type { ModuleOptions } from '../module'
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
export function initGtag(tag: GoogleTagOptions, options: ModuleOptions) {
  window.dataLayer = window.dataLayer || []

  for (const command of tag.initCommands ?? [])
    gtag(...command)

  gtag('js', new Date())
  gtag('config', tag.id, tag.config ?? {})
}
