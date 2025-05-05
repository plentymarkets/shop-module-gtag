// Expose plugin types
import type {} from 'nuxt/app'
import type { ModuleOptions } from '../../module'
import {
  defineNuxtPlugin,
  useRegisterCookie,
  useRuntimeConfig,
} from '#imports'
import { CookieName } from '../utils'

export default defineNuxtPlugin({
  parallel: true,
  setup() {
    const options = useRuntimeConfig().public.pwa_module_gtag as ModuleOptions
    if (!options.id) return

    // Cookie Registration
    const { add } = useRegisterCookie()
    const optOut = options.cookieOptOut || options.cookieGroup === 'CookieBar.essentials.label'

    if (options.cookieGroup) {
      add({
        name: CookieName,
        Provider: 'CookieBar.moduleGoogleAnalytics.provider',
        Status: 'CookieBar.moduleGoogleAnalytics.status',
        PrivacyPolicy: 'https://policies.google.com/privacy',
        Lifespan: 'Session',
        cookieNames: ['/^_ga/', '_ga', '_gid', '_gat'],
        accepted: optOut,
      }, options.cookieGroup)
    }
  },
})
