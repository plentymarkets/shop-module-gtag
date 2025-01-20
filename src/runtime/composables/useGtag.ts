import type { ModuleOptions } from '../../module'
import type { Gtag } from '../types'
import { useHead, useRuntimeConfig } from '#imports'
import { withQuery } from 'ufo'
import { disableAnalytics as _disableAnalytics, enableAnalytics as _enableAnalytics } from '../analytics'
import { gtag, initGtag } from '../utils'

export function useGtag() {
  const options = useRuntimeConfig().public.pwa_module_gtag as ModuleOptions

  let _gtag: Gtag
  // Return a noop function if this composable is called on the server.
  if (import.meta.server)
    _gtag = () => {}
  else if (import.meta.client)
    _gtag = gtag

  /**
   * Manually initialize the Google tag library.
   *
   * @remarks
   * If no custom Google tag ID is provided, the default Google tag ID from the module options will be used.
   */
  const initialize = () => {
    if (import.meta.client) {
      if (!document.head.querySelector('script[data-gtag]')) {
        useHead({
          script: [{
            'src': withQuery('https://www.googletagmanager.com/gtag/js', { id: options.id }),
            'data-gtag': '',
          }],
        })
      }

      if (!window.dataLayer && options.id)
        initGtag({
          id: options.id,
          config: options.config,
        }, options)
    }
  }

  /**
   * Disable Google Analytics measurement.
   *
   * @remarks
   * The `gtag.js` library includes a `window['ga-disable-GA_MEASUREMENT_ID']`
   * property that, when set to `true`, disables `gtag.js` from sending data to Google Analytics.
   *
   * @see {@link https://developers.google.com/analytics/devguides/collection/gtagjs/user-opt-out Disable Google Analytics measurement}
   */
  function disableAnalytics() {
    if (import.meta.client && options.id) {
      _disableAnalytics(options.id)
    }
  }

  /**
   * Enable Google Analytics measurement if it was previously disabled.
   *
   * @remarks
   * The `gtag.js` library includes a `window['ga-disable-GA_MEASUREMENT_ID']`
   * property that, when set to `true`, disables `gtag.js` from sending data to Google Analytics.
   *
   * @see {@link https://developers.google.com/analytics/devguides/collection/gtagjs/user-opt-out Disable Google Analytics measurement}
   */
  function enableAnalytics() {
    if (import.meta.client && options.id) {
      _enableAnalytics(options.id)
    }
  }

  return {
    gtag: _gtag!,
    initialize,
    disableAnalytics,
    enableAnalytics,
  }
}
