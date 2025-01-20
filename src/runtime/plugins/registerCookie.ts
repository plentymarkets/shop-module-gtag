import type { ModuleOptions } from '../../module'
import { defineNuxtPlugin, useRuntimeConfig } from 'nuxt/app'
import { CookieName } from '../utils'

export default defineNuxtPlugin(() => {
  const runtimeConfig = useRuntimeConfig()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const initialCookies = runtimeConfig.public?.cookieGroups as any
  const options = useRuntimeConfig().public.pwa_module_gtag as ModuleOptions
  if (!options.id) return

  if (initialCookies && initialCookies.groups) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialCookies.groups.forEach((cookieGroup: any) => {
      if (cookieGroup.name === 'CookieBar.functional.label') {
        if (!cookieGroup.cookies) {
          cookieGroup.cookies = []
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (cookieGroup.cookies.some((cookie: any) => cookie.name === CookieName)) {
          return
        }
        cookieGroup.cookies.push({
          name: CookieName,
          Provider: 'CookieBar.moduleGoogleAnalytics.provider',
          Status: 'CookieBar.moduleGoogleAnalytics.status',
          PrivacyPolicy: '/PrivacyPolicy',
          Lifespan: 'Session',
        })
        return
      }
    })
  }
})
