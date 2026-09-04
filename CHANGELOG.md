# Change log: `@plentymarkets/pwa-module-gtag`

### 1.4.0

### Minor Changes

- Added support for advanced consent mode
  Add this to your `nuxt.config.ts`:
  ``` ts
  pwa_module_gtag: {
    config: {
      initCommands: [
        ['consent', 'default', {
          ad_user_data: 'denied',
          ad_personalization: 'denied',
          ad_storage: 'denied',
          analytics_storage: 'denied',
          wait_for_update: 500,
        }]
      ]
    }
  },
  ```

### 1.3.0
### Minor Changes

- Updated nuxt package to version 4.4.2
- Updated shop-core package to version 1.23.0

### 1.2.0
### Minor Changes

- Migrate from pnpm to npm

### 1.1.4
### Patch Changes

- Updated dependencies
- Fix shop-core installation

# 1.1.3
### Patch Changes

- Fixed an issue where the environment variables did not match the ones set in the main repoisitory.
- Updated dependencies

## 1.1.1

### Patch Changes

REMOVED `PWA_MODULE_GA_ANONYMIZE_IP` setting.
