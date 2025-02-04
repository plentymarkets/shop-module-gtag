# PlentyONE Shop Google Analytics nuxt module

## Environment Variables

| Environment Variable | Type     | Default | Description                                                                                            |
|-------------------|----------|--------|--------------------------------------------------------------------------------------------------------|
| PWA_MODULE_GA_ENABLED | `int`    | `0`    | To enable the module it needs to be `1`.                                                               |
| PWA_MODULE_GA_ID | `string` | `''`   | The Google tag ID to initialize. If its empty, GA is deactivated                                       |
| PWA_MODULE_GA_ANONYMIZE_IP | `int`    | `0`    | To anonymize the users IP addresses for GA, to enable it the value needs to be `1`                     |
| PWA_MODULE_GA_SHOW_GROSS_PRICES | `int`    | `0`    | To use gross/net prices for e.g. the `purchase`-event. For gross prices this value needs to be `1`     |
| PWA_MODULE_GA_COOKIE_GROUP | `string` | `CookieBar.marketing.label`     | To change the cookie group for the plentyONE Shop cookie bar.                                          |
| PWA_MODULE_GA_OPT_OUT | `int`    | `0`    | To register the cookie as a opt-out needs to be `1`, only working if the cookie group isn't essential. |

## License

[MIT](./LICENSE) License © 2023-PRESENT [Johann Schopplich](https://github.com/johannschopplich)
