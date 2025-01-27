// Expose plugin types
import type {} from 'nuxt/app'
import type { ModuleOptions } from '../../module'
import { defineNuxtPlugin, useGtag, useRuntimeConfig, watch } from '#imports'
import { useCookieConsent } from '~/composables/useCookieConsent'
import { useMakeOrder } from '~/composables/useMakeOrder'
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

    // Order Watcher
    const { data: order } = useMakeOrder()
    watch(order, (value) => {
      if (value && value?.order?.id && consent.value) {
        const totalVat = value.totals.vats.reduce((acc: number, vat: { value: number }) => acc + vat.value, 0)

        gtag('event', 'purchase', {
          transaction_id: value.order.id,
          value: options.showGrossPrices ? value.totals.totalGross : value.totals.totalNet,
          currency: value.totals.currency,
          tax: totalVat,
          shipping: options.showGrossPrices ? value.totals.shippingGross : value.totals.shippingNet,
          items: value.order.orderItems.map((item: { id: number, orderItemName: string, quantity: number }) => ({
            item_id: item.id,
            item_name: item.orderItemName,
            quantity: item.quantity,
          })),
        })
      }
    })
  },
})
