# Olympus Labs Protocol Library

[![pipeline status](https://gitlab.com/aireach/olympus-protocol/badges/master/pipeline.svg)](https://gitlab.com/aireach/protocol-architecture/commits/master)

[![coverage report](https://gitlab.com/aireach/olympus-protocol/badges/develop/coverage.svg)](https://gitlab.com/aireach/olympus-protocol/commits/develop)

# Olympus 2.0

- ETH 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee

## Test

`npm run test` will test all the suits.

`truffle test --suite=Mockfund ./test/fund/*` Will test a concrete suit, require `./node_modules/.bin/testrpc-sc` started in other terminal.
The suit option will limit the number of deployment required for the concrete test file.

# Deployed addresses (Mainnet 13 ,July, 2018)

- ExchangeAdapterManager: 0x9a555f092dd910ac6ddedac20307ab5bf8cc26b5
- KyberAdapter: 0x5e2e0267fbea3840a0c32c40e3542d356cd37520
- ExchangeProvider: 0x7e6e2a2a7a8b19254d18cda26d5756496ea6c791
- RebalanceProvider:0x6c720df0dbb4f202ca531866a452ea6330aceff4
- Marketplace 0xfb63fd5949de05090c45d881f61b7aefbccdb9b8
- AsyncWithdraw: 0xa35d0010f6bfde3d32230f188d801248b2da7b16
- RiskControl: 0x15da4c79d95dbf352703a427b5ec76efdeaa19ac
- Reimbursable: 0x12c3aa88a66c0b7de8a81052e6da467ee66b2517
- PercentageFee: 0xCdA0E5ED6bD8313BBD7B1c52c5108c45314897Ef
- WhitelistProvider: 0xab5853728d776ca34521767211796d106dd19caf

## Kovan

Exchange subcomponent:

- KyberNetworkAdapter 0x05e4c2c5b4bb9541274b1b2289297132b86fc965
- ExchangeAdapterManager 0x15de419089c7b95e9ec94b88b6119837edddda59
  0x334635f9b2b3b2a6d0406eb3a9fb42ea18222678

- ComponentList 0x334635f9b2b3b2a6d0406eb3a9fb42ea18222678
  - ExchangeProvider 0x023d373f70662e8b7031421cfc513aeeaffb983a
  - Marketplace 0x610a2d32c4d426f3712c4d0b39edce82434d7a23
  - AsyncWithdraw 0xb1335ecb9996d27b4dc55c61e351645a3dd48ab3
  - Reimbursable 0xf28e13b85db2b63158a41d4555b434811f87081d
  - PercentageFee 0xe2b21fb3d2e917e8e89ea0af89366aabf9bf8bd4
  - WhitelistProvider 0xb4159f78a40f4631f31f9e873afa1cfd038610f7
  - Rebalance Provider 0xa2d8a19896787028ec0b28a66f537e16e01f0c4f
  - RISK (DUMMY) 0x3b021c90fd2f5ff847a1d363532531bd496ddb9d

# Deployed addresses (Mainnet 7 July, 2018) - Deprecated

- ComponentList 0x808806d6c795246c16736a8ca556c5a0e6c0a585
  - Marketplace 0x0e59555df877ac4e634d42f196906c16fe540beb
  - WhiteListProvider 0x7511461aec8cf83e2b9a2c573dbca1c0aa9410b8
  - PercentageFee 0x69f90f1bfde0939c41c5d01bfdc9a88fe252bd64
  - ExchangeAdapterManager: 0x6d1e9ca4d69a6e036a180f1fbe9ee4e65753dd5b
  - KyberNetworkAdapter: 0xB083b81faAd24BEB82Bb30E48dC452902Cc4d4fB
  - ExchangeProvider: 0xc15a8b8B19b2A989F4C7ea0b93d240245E8874a0
  - RebalanceProvider: 0x5cF1c596bCF3899acA2F4A26A4160b7885e0fEF1
  - Reimbursable: 0xA3e9722EC79240C9A6Bd8e048040Be0aD04CB83B
  - AsyncWithdraw: 0x89f55ec0cd96b8ac29ed8c9a6300228fc8fa2f42
  - RiskControl 0x3f9cd1a739c3a9d279f0cb51c9e384cce17a018c

* Olympus Fund: 0xb83894Ea21781f947D8DbF1cA102117DCDDf0d05

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
ExchangeManager: 0x1bfc5f6ccf99b99388c03773eb65a5d7ca8f1386<br/>
KyberNetworkExchange: 0x71A65496612224077bDB42CA56265F42e65096A7<br/>

### NEW EXCHANGE

ExchangeManager 0x0f7c1afa57b1b4ceb9edc5e89b0091253738cbff<br/>
ExchangeProvider 0x5e0651f6e9c6d867c68b2df60b4d5ec855ca9337<br/>
KyberNetworkExchange 0xe24fe01e5e415556a6a09b61cf9a6fd4a8672650<br/>

### Kyber

0x964F35fAe36d75B1e72770e244F6595B68508CF5 Kyber<br/>
0xD2D21FdeF0D054D2864ce328cc56D1238d6b239e Mainnet Testkyber<br/>

## Kovan

### JUNE 7 version

Core: 0xc7bfb4c0f35d8d42c724a0af1e0f1c6a2a4f60d5<br/>
PermissionProvider: 0x6b7e53420cb313a2a25f7d8835a09c1634285c9a<br/>
ExchangeProvider: 0xa3078A7332bc17f6621fE7B83eE5EB5A788d536a<br/>
PriceProvider: 0x2891330314bbeb473f0d9c1bb81b611ceb15b1d1<br/>
StrategyProvider: 0xf268c97eb57db405091caccaafc1a90f45f2493a<br/>
WhitelistProvider: 0x96ed6cba27c59476921221204e74100903796942<br/>
Storage: 0xa932dbda40579ad4f588b6bbe25811450179fd19<br/>
ExtendedStorage: 0x0c28b67b0a7e48e480a0499dac503dc9335a8c54<br/>
ExchangeManager: 0x85fce64140d4fedf4ce81e2fdfac9c03d7bc0234<br/>
KyberNetworkExchange: 0x69ab4694b7f06f0783a5e651bc75d407323e86ba<br/>

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

For more detail, see migrations/deployment.md

## Mainnet

For the mainnet, don't forget to change the MOT address in Core to the mainnet MOT address

## Steps

1.  Deploy Permission Provider and Core using the Permission Providers' address
2.  Use Core and Permission addresses to deploy the rest
3.  Update the configured provider addresses in the core
4.  Update the owners of of the providers
5.  set AddCore to the core address in the permission provider

## Extra Steps

1.  Make sure the orderId in storage is something that's not used before
2.  Add indexes to the strategy provider
3.  Send initial ETH to the exchange part
4.  Configure price provider
