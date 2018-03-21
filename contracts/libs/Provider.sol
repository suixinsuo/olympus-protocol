pragma solidity ^0.4.18;


contract Provider {
    enum ProvderType {
        Strategy,
        Pricing,
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

    string public name;
    ProvderType public providerType;
    string public description;
    mapping(string => bool) internal properties;
    ProviderStatistic public statistics;
}