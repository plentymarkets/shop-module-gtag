# PlentyShop ONE Shop Google Analytics Module

## Environment Variables

| Environment Variable | Type      | Default | Description                                                                                        |
|-------------------|-----------|---------|----------------------------------------------------------------------------------------------------|
| PWA_MODULE_GA_ID | `string`  | `''`    | The Google tag ID to initialize. If its empty, GA is deactivated                                   |
| PWA_MODULE_GA_ANONYMIZE_IP | `int`     | `0`     | To anonymize the users IP addresses for GA, to enable it the value needs to be `1`                                                           |
| PWA_MODULE_GA_TRACK_ORDER | `int` | `0`     | To track orders in GA, to enable it the value needs to be `1`                                      |
| PWA_MODULE_GA_SHOW_GROSS_PRICES | `int` | `0`     | To use gross/net prices for e.g. the `purchase`-event. For gross prices this value needs to be `1` |

## License

[MIT](./LICENSE) License © 2023-PRESENT [Johann Schopplich](https://github.com/johannschopplich)
