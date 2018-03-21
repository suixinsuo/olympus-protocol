pragma solidity ^0.4.18;

import "../libs/Ownable.sol";
import "../libs/Provider.sol";


contract Publish is Ownable {
    address[] public publisher;

    modifier onlyPublisher() {
        require(checkPublisher(msg.sender));
        _;
    }

    function publish() public {
        publisher.push(owner);
    }

    function addPublisher(address _publisher) public onlyOwner {
        for (uint i = 0; i < publisher.length; i++) {
            if (publisher[i] == _publisher) {
                return;
            }
        }
        publisher.push(_publisher);
    }

    function removePublisher(address _publisher) public onlyOwner {
        uint i = 0;
        for (; i < publisher.length; i++) {
            if (publisher[i] == _publisher) {
                break;
            }
        }

        if (i > publisher.length - 1) {
            //not found
            return;
        } else {
            publisher[i] = publisher[publisher.length - 1];
            publisher.length = publisher.length - 1;
            return;
        }
    }

    function checkPublisher(address _publisher) public pure returns(bool success) {
        return true;
    }
}


contract PriceProvider is Provider, Ownable, Publish {
    bytes32[] public tokenAddressExchangeSenders;
    uint[] public price;
    uint public nonce;
    
    mapping(bytes32 => uint) public priceList;
    
    event PriceUpdated(uint _nonce, bytes32 _tokenAddress, uint pirce);

    function PriceProvider (uint _number) public {
        nonce = _number;
    }       

    //Update_price
    function updatePrices(bytes32[] _tokenAddressExchangeSenders, uint[] _price, uint _nonce) 
        external returns (bool success) 
    {
        require(nonce == _nonce);
        require(_tokenAddressExchangeSenders.length == _price.length);
        nonce = _nonce + 1;
        for (uint i = 0; i < _tokenAddressExchangeSenders.length; i++) {
            priceList[_tokenAddressExchangeSenders[i]] = _price[i];
            PriceUpdated(_nonce, _tokenAddressExchangeSenders[i], _price[i]);
        }
        return true;
    }
    
    //function getPrices(address[] tokenAddresses) external returns (uint[] prices);
    function getPrice(bytes32 _tokenAddressExchangeSender) public constant returns(uint _result) {
        return(priceList[_tokenAddressExchangeSender]);
    }

    function getNonce() public constant returns(uint) {
        return nonce;
    }    
}
