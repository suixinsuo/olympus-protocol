pragma solidity ^0.4.18;

import "./Manageable.sol";


library TypeDefinitions {
    string public constant ROLE_CORE = "core";
    string public constant ROLE_STORAGE = "storage";
    string public constant ROLE_CORE_OWNER = "CoreOwner";
    string public constant ROLE_STRATEGY_OWNER = "StrategyOwner";
    string public constant ROLE_PRICE_OWNER = "PriceOwner";
    string public constant ROLE_EXCHANGE_OWNER = "ExchangeOwner";
    string public constant ROLE_EXCHANGE_ADAPTER_OWNER = "ExchangeAdapterOwner";
    string public constant ROLE_STORAGE_OWNER = "StorageOwner";
    string public constant ROLE_WHITELIST_OWNER = "WhitelistOwner";

    enum ProviderType {
        Strategy,
        Price,
        Exchange,
        Storage,
        ExtendedStorage,
        Whitelist
    }

    struct ProviderStatistic {
        uint counter;
        uint amountInEther;
        uint reputation;
    }

    struct ERC20Token {
        string symbol;
        address tokenAddress;
        uint decimal;
    }
}

contract Provider is Manageable {
    string public name;
    TypeDefinitions.ProviderType public providerType;
    string public description;
    mapping(string => bool) internal properties;
    TypeDefinitions.ProviderStatistic public statistics;
}
