#### Olympuslabs Contracts 部署步骤

```js
1. deploy PermissionProvider


2. deploy Core (with PermissionProvider.address)


3. deploy StrategyProvider (with PermissionProvider.address Core.address)

   core.setProvider(0, StrategyProvider.address);
   
4. deploy PriceProvider (with PermissionProvider.address)
    
   core.setProvider(1, PriceProvider.address);
   PriceProvider.SetKyber(kyberNetwork) //主网测试网络地址不同
   
5. deploy ExtendedStorage (with PermissionProvider.address)

   core.setProvider(4, ExtendedStorage.address);

6. deploy OlympusStorage (with PermissionProvider.address)

   core.setProvider(3, OlympusStorage.address);

7. deploy WhitelistProvider (with PermissionProvider.address)

   core.setProvider(5, WhitelistProvider.address);

8. SetCore PermissionProvider.adminAdd (Core.address, string "core")

```
```js
9. deploy ExchangeAdapterManager (with PermissionProvider.address);

10. deploy ExchangeProvider (with ExchangeAdapterManager.address, PermissionProvider.address)

11. deploy KyberNetworkExchange(with 
kyberNetwork,  //主网测试网络地址不同
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
