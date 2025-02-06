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
      if (cookieGroup.name === options.cookieGroup) {
        if (!cookieGroup.cookies) {
          cookieGroup.cookies = []
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (cookieGroup.cookies.some((cookie: any) => cookie.name === CookieName)) {
          return
        }

        const optOut = options.cookieOptOut || options.cookieGroup === 'CookieBar.essentials.label'

        cookieGroup.cookies.push({
          name: CookieName,
          Provider: 'CookieBar.moduleGoogleAnalytics.provider',
          Status: 'CookieBar.moduleGoogleAnalytics.status',
          PrivacyPolicy: 'https://policies.google.com/privacy',
          Lifespan: 'Session',
          cookieNames: ['/^_ga/', '_ga', '_gid', '_gat'],
          accepted: optOut,
        })
        return
      }
    })
  }
})
