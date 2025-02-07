// Expose plugin types
import type {} from 'nuxt/app'
import type { ModuleOptions } from '../../module'
import { defineNuxtPlugin, useCookieConsent, useRuntimeConfig, watch } from '#imports'
import { useGtag } from '../composables/useGtag'
import { CookieName } from '../utils'

export default defineNuxtPlugin({
  parallel: true,
  setup() {
    const options = useRuntimeConfig().public.pwa_module_gtag as ModuleOptions
    if (!options.id) return

    const { consent } = useCookieConsent(CookieName)
    const { initialize, enableAnalytics, disableAnalytics, gtag } = useGtag()

    if (consent.value) {
      enableAnalytics()
      initialize()
    }

    // Consent Watcher
    watch(consent, (value) => {
      if (value) {
        initialize()
        gtag('consent', 'update', {
          ad_user_data: 'granted',
          ad_personalization: 'granted',
          ad_storage: 'granted',
          analytics_storage: 'granted',
        })
        enableAnalytics()
      }
      else {
        gtag('consent', 'update', {
          ad_user_data: 'denied',
          ad_personalization: 'denied',
          ad_storage: 'denied',
          analytics_storage: 'denied',
        })
        disableAnalytics()
      }
    })
  },
})
