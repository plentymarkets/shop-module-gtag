// Expose plugin types
import type {} from 'nuxt/app'
import type { ModuleOptions } from '../../module'
import {
  defineNuxtPlugin,
  useCookieConsent,
  usePlentyEvent,
  useRegisterCookie,
  useRuntimeConfig,
  watch,
} from '#imports'
import { cartGetters, orderGetters } from '@plentymarkets/shop-api'
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

    // Events
    const { on } = usePlentyEvent()
    on('frontend:orderCreated', (order) => {
      if (consent.value && order.order && order.totals) {
        const totalVat = order.totals.vats.reduce((acc: number, vat: { value: number }) => acc + vat.value, 0)
        gtag('event', 'purchase', {
          transaction_id: orderGetters.getId(order),
          value: options.showGrossPrices ? order.totals.totalGross : order.totals.totalNet,
          currency: order.totals.currency,
          tax: totalVat,
          shipping: options.showGrossPrices ? order.totals.shippingGross : order.totals.shippingNet,
          items: order.order.orderItems.map(item => ({
            item_id: orderGetters.getItemVariationId(item),
            item_name: orderGetters.getItemName(item),
            quantity: orderGetters.getItemQty(item),
          })),
        })
      }
    })

    on('frontend:addToCart', (data) => {
      if (consent.value) {
        gtag('event', 'add_to_cart', {
          items: [{
            item_id: cartGetters.getVariationId(data.item),
            item_name: cartGetters.getItemName(data.item),
            quantity: data.addItemParams.quantity,
          }],
        })
      }
    })

    on('frontend:removeFromCart', (data) => {
      if (consent.value) {
        gtag('event', 'remove_from_cart', {
          items: [{
            item_id: data.deleteItemParams.cartItemId,
          }],
        })
      }
    })

    on('frontend:beginCheckout', (data) => {
      if (consent.value) {
        gtag('event', 'begin_checkout', {
          currency: cartGetters.getCurrency(data),
          value: options.showGrossPrices ? data.basketAmount : data.basketAmountNet,
          items: data?.items?.map(item => ({
            item_id: cartGetters.getVariationId(item),
            item_name: cartGetters.getItemName(item),
            quantity: cartGetters.getItemQty(item),
          })),
        })
      }
    })

    on('frontend:addToWishlist', (data) => {
      if (consent.value) {
        gtag('event', 'add_to_wishlist', {
          items: [{
            item_id: data.variationId,
          }],
        })
      }
    })

    on('frontend:signUp', (data) => {
      if (consent.value) {
        gtag('event', 'sign_up', {
          method: data.method,
        })
      }
    })

    on('frontend:login', (data) => {
      if (consent.value) {
        gtag('event', 'login', {
          method: data.method,
        })
      }
    })

    on('frontend:searchProduct', (data) => {
      if (consent.value) {
        gtag('event', 'search', {
          search_term: data,
        })
      }
    })

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
