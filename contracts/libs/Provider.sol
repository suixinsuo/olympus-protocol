pragma solidity ^0.4.18;

import "./Manageable.sol";


library TypeDefinitions {
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
