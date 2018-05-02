#### Olympuslabs Contracts Deployment steps

```js
1. deploy PermissionProvider


2. deploy Core (with PermissionProvider.address)


3. deploy StrategyProvider (with PermissionProvider.address Core.address)

   core.setProvider(0, StrategyProvider.address);

4. deploy PriceProvider (with PermissionProvider.address)

   core.setProvider(1, PriceProvider.address);
   PriceProvider.SetKyber(kyberNetwork) // be careful kyber address is different on kovan / mainnet.
   //0x65B1FaAD1b4d331Fd0ea2a50D5Be2c20abE42E50 kovan
5. deploy ExtendedStorage (with PermissionProvider.address)

6. deploy OlympusStorage (with PermissionProvider.address)

   core.setProvider(3, OlympusStorage.address);
   OlympusStorage.setProvider(4, ExtendedStorage.address);

7. deploy WhitelistProvider (with PermissionProvider.address)

   core.setProvider(5, WhitelistProvider.address);

8. SetCore PermissionProvider.adminAdd (Core.address, string "core")

```
```js
9. deploy ExchangeAdapterManager (with PermissionProvider.address);

10. deploy ExchangeProvider (with ExchangeAdapterManager.address, PermissionProvider.address)

11. deploy KyberNetworkExchange(with
kyberNetwork,  // be careful of kyber has different addresses on kovan / mainnet.
//0x65B1FaAD1b4d331Fd0ea2a50D5Be2c20abE42E50 onkovan
ExchangeAdapterManager.address,
ExchangeProvider.address,
PermissionProvider.address)

12. exchangeAdapterManager.addExchange('kyber', KyberNetworkExchange.address)

13. send ETH to KyberNetworkExchange

14. ExchangeProvider.setCore(core.address)

15. core.setProvider(2, ExchangeProvider.address);

```

```
16. Create strategy (StrategyProvider)
17. Change supported token (PriceProvider)
```
