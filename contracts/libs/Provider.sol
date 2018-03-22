pragma solidity ^0.4.18;


library TypeDefinitions {
    enum ProvderType {
        Strategy,
        Price,
        Exchange
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

contract Provider {
    string public name;
    TypeDefinitions.ProvderType public providerType;
    string public description;
    mapping(string => bool) internal properties;
    TypeDefinitions.ProviderStatistic public statistics;
}
