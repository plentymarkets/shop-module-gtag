import type { GoogleTagOptions } from './runtime/types'
import { addImports, addPlugin, createResolver, defineNuxtModule, installModule } from '@nuxt/kit'
import { defu } from 'defu'

export interface ModuleOptions {
  id?: string
  enabled?: boolean;
  config?: GoogleTagOptions['config']
  anonymizeIP?: boolean
  showGrossPrices?: boolean
  cookieGroup?: string
  cookieOptOut?: boolean
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@plentymarkets/pwa-module-gtag',
    configKey: 'pwa_module_gtag',
    compatibility: {
      nuxt: '>=3.7',
    },
  },
  defaults: {
    id: '',
    enabled: false,
    config: {},
    anonymizeIP: false,
    showGrossPrices: false,
    cookieGroup: 'CookieBar.marketing.label',
    cookieOptOut: false
  },
  async setup(options: ModuleOptions, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    await installModule('@plentymarkets/shop-core');

    // Add module options to public runtime config
    nuxt.options.runtimeConfig.public.pwa_module_gtag = defu(
      nuxt.options.runtimeConfig.public.pwa_module_gtag,
      options,
    )

    nuxt.options.runtimeConfig.public.pwa_module_gtag.id = process.env.PWA_MODULE_GA_ID as string
    nuxt.options.runtimeConfig.public.pwa_module_gtag.enabled = process.env?.PWA_MODULE_GA_ENABLED === '1'
    nuxt.options.runtimeConfig.public.pwa_module_gtag.anonymizeIP = process.env?.PWA_MODULE_GA_ANONYMIZE_IP === '1'
    nuxt.options.runtimeConfig.public.pwa_module_gtag.showGrossPrices = process.env?.PWA_MODULE_GA_SHOW_GROSS_PRICES === '1'
    nuxt.options.runtimeConfig.public.pwa_module_gtag.cookieOptOut = process.env?.PWA_MODULE_GA_OPT_OUT === '1'
    nuxt.options.runtimeConfig.public.pwa_module_gtag.cookieGroup = (process.env.PWA_MODULE_GA_COOKIE_GROUP as string) || 'CookieBar.marketing.label'

    if (nuxt.options.runtimeConfig.public.pwa_module_gtag.id === '' || !nuxt.options.runtimeConfig.public.pwa_module_gtag.enabled) {
      return
    }

    nuxt.hook('i18n:registerModule', (register) => {
      register({
        langDir: resolve('./runtime/lang'),
        locales: [
          {
            code: 'en',
            file: 'en.json',
          },
          {
            code: 'de',
            file: 'de.json',
          },
        ],
      })
    })

    // Transpile runtime
    nuxt.options.build.transpile.push(resolve('runtime'))

    addImports({
      name: 'useGtag',
      from: resolve(`runtime/composables/useGtag`),
      as: 'useGtag',
    })

    addPlugin({
      src: resolve('runtime/plugins/plugin.client'),
      mode: 'client',
    })
  },
})
