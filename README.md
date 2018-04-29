# Olympus Labs Protocol Library

[![pipeline status](https://gitlab.com/aireach/olympus-protocol/badges/master/pipeline.svg)](https://gitlab.com/aireach/protocol-architecture/commits/master)

[![coverage report](https://gitlab.com/aireach/olympus-protocol/badges/develop/coverage.svg)](https://gitlab.com/aireach/olympus-protocol/commits/develop)

# Deployed addresses

## Mainnet
### v1.0.0-review-pending
Core: 0xd332692cf20cbc3aa39abf2f2a69437f22e5beb9<br/>
PermissionProvider: 0x402d3bf5d448871810a3ec8a33fb6cc804f9b26e<br/>
ExchangeProvider: 0xcf7de40d32c959c31145e9379c4d5c745bfab45f<br/>
PriceProvider: 0xeacf161734b4e326ca2ba991b8e7872654ad2af4<br/>
StrategyProvider: 0x18c54b043efc6d4c15bdab8a2ce499388b4bf6b3<br/>
WhitelistProvider: 0x73eb1e6ad565e907f486d9fc7a807e50d38ca200<br/>
Storage: 0x9ff1a52be89f728f058cce9f91661260e5614fd1<br/>
ExtendedStorage: 0xDf52c174d6595bceE998A4f751f464D5Ef13f1B5<br/>
//ExchangeManager: 0x1bfc5f6ccf99b99388c03773eb65a5d7ca8f1386<br/>
KyberNetworkExchange: 0x71A65496612224077bDB42CA56265F42e65096A7<br/>
### NEW EXCHANGE
ExchangeManager  0x0f7c1afa57b1b4ceb9edc5e89b0091253738cbff<br/>
ExchangeProvider  0x5e0651f6e9c6d867c68b2df60b4d5ec855ca9337<br/>
KyberNetworkExchange   0xe24fe01e5e415556a6a09b61cf9a6fd4a8672650<br/>   

### Kyber
0x964F35fAe36d75B1e72770e244F6595B68508CF5    Kyber<br/>   
0xD2D21FdeF0D054D2864ce328cc56D1238d6b239e    Mainnet Testkyber<br/>   



## Kovan
### v1.0.0-review-pending
Core: 0xeEF996Ca4Fe62f826601aE5c1d6fe77d8193513c<br/>
PermissionProvider: 0xdef673F4ecc19fC9439Dd7Ee1f934eE6a35d404C<br/>
ExchangeProvider: 0x7DC3924b9580981A0ad45A76A58C242eD55c03aF<br/>
PriceProvider: 0x3e27CdE65D2CC92F483968efD778d2E8bF047992<br/>
StrategyProvider: 0x484c2bF3c3B986039D1fd7295F07B428F2ae6FA7<br/>
WhitelistProvider: 0xe34c3c550C5b2Ca0a4C29614096A27f7261D3062<br/>
Storage: 0x1a67e378f511a1E5e139bc34FD2955B8D3F45F21<br/>
ExtendedStorage: 0xcEb51bD598ABb0caa8d2Da30D4D760f08936547B<br/>

### Admins
Owner: 0xd7b02e4c876c6920aadfe2b80a73df3ffea44c48<br/>
priceOwner: 0x2576F5EF8309DBB23c39be29D62273B4c917D783<br/>
exchangeOwner: 0xB878496B5a59c9AE84018F9846aB00419Bf0e682<br/>
whitelistOwner: 0xB878496B5a59c9AE84018F9846aB00419Bf0e682<br/>


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



