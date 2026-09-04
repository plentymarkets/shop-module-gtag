import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref, watch } from 'vue'

const gtagSpy = vi.fn()
const initializeSpy = vi.fn()
const enableAnalyticsSpy = vi.fn()
const disableAnalyticsSpy = vi.fn()

let consent: ReturnType<typeof ref<boolean>>
let runtimeConfigPublic: Record<string, any>
const eventHandlers: Record<string, (payload: any) => void> = {}

vi.mock('#imports', () => ({
  defineNuxtPlugin: (def: any) => def,
  useRuntimeConfig: () => ({ public: runtimeConfigPublic }),
  useCookieConsent: () => ({ consent }),
  usePlentyEvent: () => ({
    on: (event: string, handler: (payload: any) => void) => {
      eventHandlers[event] = handler
    },
  }),
  watch,
}))

vi.mock('@plentymarkets/shop-api', () => ({
  cartGetters: {
    getVariationId: (item: any) => item.variationId,
    getItemName: (item: any) => item.name,
    getItemQty: () => 1,
    getCurrency: () => 'EUR',
  },
  orderGetters: {
    getId: (order: any) => order.order.id,
    getItemVariationId: (item: any) => item.variationId,
    getItemName: (item: any) => item.name,
    getItemQty: () => 1,
  },
}))

vi.mock('../composables/useGtag', () => ({
  useGtag: () => ({
    gtag: gtagSpy,
    initialize: initializeSpy,
    enableAnalytics: enableAnalyticsSpy,
    disableAnalytics: disableAnalyticsSpy,
  }),
}))

async function loadPlugin() {
  const mod = await import('./plugin.client')
  return mod.default
}

describe('gtag plugin.client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    for (const key of Object.keys(eventHandlers)) delete eventHandlers[key]
    consent = ref(false)
    runtimeConfigPublic = { pwa_module_gtag: { id: 'G-TEST', showGrossPrices: false } }
    vi.resetModules()
  })

  it('does nothing when no tag id is configured', async () => {
    runtimeConfigPublic = { pwa_module_gtag: { id: '' } }
    const plugin = await loadPlugin()

    plugin.setup!({} as any)

    expect(initializeSpy).not.toHaveBeenCalled()
    expect(Object.keys(eventHandlers)).toHaveLength(0)
  })

  it('initializes and enables analytics immediately when consent is already granted', async () => {
    consent.value = true
    const plugin = await loadPlugin()

    plugin.setup!({} as any)

    expect(initializeSpy).toHaveBeenCalledTimes(1)
    expect(enableAnalyticsSpy).toHaveBeenCalledTimes(1)
  })

  it('does not initialize or enable analytics when consent starts denied', async () => {
    const plugin = await loadPlugin()

    plugin.setup!({} as any)

    expect(initializeSpy).not.toHaveBeenCalled()
    expect(enableAnalyticsSpy).not.toHaveBeenCalled()
  })

  it('updates consent to granted and initializes when the user accepts', async () => {
    const plugin = await loadPlugin()
    plugin.setup!({} as any)

    consent.value = true
    await vi.waitFor(() => expect(initializeSpy).toHaveBeenCalledTimes(1))

    expect(gtagSpy).toHaveBeenCalledWith('consent', 'update', {
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      ad_storage: 'granted',
      analytics_storage: 'granted',
    })
    expect(enableAnalyticsSpy).toHaveBeenCalledTimes(1)
  })

  it('updates consent to denied and disables analytics when the user revokes', async () => {
    consent.value = true
    const plugin = await loadPlugin()
    plugin.setup!({} as any)
    gtagSpy.mockClear()

    consent.value = false
    await vi.waitFor(() => expect(disableAnalyticsSpy).toHaveBeenCalledTimes(1))

    expect(gtagSpy).toHaveBeenCalledWith('consent', 'update', {
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      ad_storage: 'denied',
      analytics_storage: 'denied',
    })
  })

  it('advanced consent mode: initializes immediately even though consent starts denied', async () => {
    runtimeConfigPublic = {
      pwa_module_gtag: {
        id: 'G-TEST',
        config: { initCommands: [['consent', 'default', { ad_storage: 'denied' }]] },
      },
    }
    const plugin = await loadPlugin()

    plugin.setup!({} as any)

    expect(initializeSpy).toHaveBeenCalledTimes(1)
    expect(enableAnalyticsSpy).not.toHaveBeenCalled()
  })

  it('advanced consent mode: does not re-initialize or disable analytics on consent changes', async () => {
    runtimeConfigPublic = {
      pwa_module_gtag: {
        id: 'G-TEST',
        config: { initCommands: [['consent', 'default', { ad_storage: 'denied' }]] },
      },
    }
    const plugin = await loadPlugin()
    plugin.setup!({} as any)
    initializeSpy.mockClear()

    consent.value = true
    await vi.waitFor(() => expect(enableAnalyticsSpy).toHaveBeenCalledTimes(1))
    expect(initializeSpy).not.toHaveBeenCalled()

    consent.value = false
    await vi.waitFor(() => expect(gtagSpy).toHaveBeenCalledWith('consent', 'update', expect.objectContaining({ ad_storage: 'denied' })))
    expect(disableAnalyticsSpy).not.toHaveBeenCalled()
  })

  it('only fires add_to_cart when consent is granted', async () => {
    const plugin = await loadPlugin()
    plugin.setup!({} as any)

    eventHandlers['frontend:addToCart']!({
      item: { variationId: 42, name: 'Widget' },
      addItemParams: { quantity: 3 },
    })
    expect(gtagSpy).not.toHaveBeenCalledWith('event', 'add_to_cart', expect.anything())

    consent.value = true
    await vi.waitFor(() => expect(initializeSpy).toHaveBeenCalled())
    gtagSpy.mockClear()

    eventHandlers['frontend:addToCart']!({
      item: { variationId: 42, name: 'Widget' },
      addItemParams: { quantity: 3 },
    })

    expect(gtagSpy).toHaveBeenCalledWith('event', 'add_to_cart', {
      items: [{ item_id: 42, item_name: 'Widget', quantity: 3 }],
    })
  })

  it('fires purchase with the net totals and computed VAT sum when showGrossPrices is false', async () => {
    consent.value = true
    runtimeConfigPublic = { pwa_module_gtag: { id: 'G-TEST', showGrossPrices: false } }
    const plugin = await loadPlugin()
    plugin.setup!({} as any)
    await vi.waitFor(() => expect(initializeSpy).toHaveBeenCalled())
    gtagSpy.mockClear()

    eventHandlers['frontend:orderCreated']!({
      order: {
        id: 987,
        orderItems: [
          { variationId: 1, name: 'Widget', referrerId: 5 },
        ],
      },
      totals: {
        totalGross: 120,
        totalNet: 100,
        shippingGross: 12,
        shippingNet: 10,
        currency: 'EUR',
        vats: [{ value: 15 }, { value: 5 }],
      },
    })

    expect(gtagSpy).toHaveBeenCalledWith('event', 'purchase', {
      transaction_id: 987,
      value: 100,
      currency: 'EUR',
      tax: 20,
      shipping: 10,
      items: [{ item_id: 1, item_name: 'Widget', quantity: 1, affiliation: '5' }],
    })
  })

  it('does not fire purchase when order/totals are missing', async () => {
    consent.value = true
    const plugin = await loadPlugin()
    plugin.setup!({} as any)
    await vi.waitFor(() => expect(initializeSpy).toHaveBeenCalled())
    gtagSpy.mockClear()

    eventHandlers['frontend:orderCreated']!({})

    expect(gtagSpy).not.toHaveBeenCalledWith('event', 'purchase', expect.anything())
  })
})
