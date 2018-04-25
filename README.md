# Olympus Labs Protocol Library

[![pipeline status](https://gitlab.com/aireach/olympus-protocol/badges/master/pipeline.svg)](https://gitlab.com/aireach/protocol-architecture/commits/master)

[![coverage report](https://gitlab.com/aireach/olympus-protocol/badges/develop/coverage.svg)](https://gitlab.com/aireach/olympus-protocol/commits/develop)

# Deployed addresses
## Kovan
### v1.0.0-review-pending
Core: 0xeEF996Ca4Fe62f826601aE5c1d6fe77d8193513c\
PermissionProvider: 0xdef673F4ecc19fC9439Dd7Ee1f934eE6a35d404C\
ExchangeProvider: 0x3298A95728caCaed2800D876a3135Da185E2c34F\
PriceProvider: 0x3e27CdE65D2CC92F483968efD778d2E8bF047992\
StrategyProvider: 0x484c2bF3c3B986039D1fd7295F07B428F2ae6FA7\
Storage: 0x1a67e378f511a1E5e139bc34FD2955B8D3F45F21\
ExtendedStorage: 0xcEb51bD598ABb0caa8d2Da30D4D760f08936547B\

Owner: 0xd7b02e4c876c6920aadfe2b80a73df3ffea44c48\
priceOwner: 0x2576F5EF8309DBB23c39be29D62273B4c917D783\
exchangeOwner: 0xb878496b5a59c9ae84018f9846ab00419bf0e682\


# Deploy instructions
## Mainnet
For the mainnet, don't forget to change the MOT address in Core to the mainnet MOT address

## Steps
1. Deploy Permission Provider and Core using the Permission Providers' address
2. Use Core and Permission addresses to deploy the rest
3. Update the configured provider addresses in the core
4. Update the owners of of the providers
5. set AddCore to the core address in the permission provider

## Extra Steps
1. Make sure the orderId in storage is something that's not used before
2. Add indexes to the strategy provider
3. Send initial ETH to the exchange part
4. Configure price provider



