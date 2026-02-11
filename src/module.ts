import type { GoogleTagOptions } from './runtime/types'
import { addImports, addPlugin, createResolver, defineNuxtModule, installModule } from '@nuxt/kit'
import { defu } from 'defu'
import { resolveEnvConfig } from './runtime/utils'

export interface ModuleOptions {
  id?: string
  enabled?: boolean
  config?: GoogleTagOptions['config']
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
    showGrossPrices: false,
    cookieGroup: 'CookieBar.marketing.label',
    cookieOptOut: false,
  },
  async setup(options: ModuleOptions, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    await installModule('@plentymarkets/shop-core')

    // Resolve env config with legacy fallback
    const envConfig = resolveEnvConfig()

    // Add module options to public runtime config
    nuxt.options.runtimeConfig.public.pwa_module_gtag = defu(
      nuxt.options.runtimeConfig.public.pwa_module_gtag,
      options,
    )

    nuxt.options.runtimeConfig.public.pwa_module_gtag = {
      ...nuxt.options.runtimeConfig.public.pwa_module_gtag,
      ...envConfig,
    }

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
    addPlugin({
      src: resolve('runtime/plugins/plugin.server'),
      mode: 'server',
    })
  },
})
