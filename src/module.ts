import type { GoogleTagOptions } from './runtime/types'
import { addImports, addPlugin, createResolver, defineNuxtModule } from '@nuxt/kit'
import { defu } from 'defu'

export interface ModuleOptions {
  id?: string
  config?: GoogleTagOptions['config']
  anonymizeIP?: boolean
  trackOrder?: boolean
  showGrossPrices?: boolean
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
    config: {},
    anonymizeIP: false,
    trackOrder: false,
    showGrossPrices: false,
  },
  setup(options: ModuleOptions, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    // Add module options to public runtime config
    nuxt.options.runtimeConfig.public.pwa_module_gtag = defu(
      nuxt.options.runtimeConfig.public.pwa_module_gtag,
      options,
    )

    nuxt.options.runtimeConfig.public.pwa_module_gtag.id = process.env.PWA_MODULE_GA_ID as string
    nuxt.options.runtimeConfig.public.pwa_module_gtag.anonymizeIP = process.env?.PWA_MODULE_GA_ANONYMIZE_IP === '1'
    nuxt.options.runtimeConfig.public.pwa_module_gtag.trackOrder = process.env?.PWA_MODULE_GA_TRACK_ORDER === '1'
    nuxt.options.runtimeConfig.public.pwa_module_gtag.showGrossPrices = process.env?.PWA_MODULE_GA_SHOW_GROSS_PRICES === '1'

    if (nuxt.options.runtimeConfig.public.pwa_module_gtag.id === '') {
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

    addImports(['useGtag', 'useTrackEvent'].map(name => ({
      from: resolve(`runtime/composables/${name}`),
      name,
    })))

    addPlugin({
      src: resolve('runtime/plugins/registerCookie'),
    })

    addPlugin({
      src: resolve('runtime/plugins/plugin.client'),
      mode: 'client',
    })
  },
})
