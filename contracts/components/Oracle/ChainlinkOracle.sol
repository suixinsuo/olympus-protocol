pragma solidity 0.4.24;

import "chainlink/solidity/contracts/Chainlinked.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "../../interfaces/ComponentInterface.sol";

contract ChainlinkOracle is Chainlinked, Ownable ,ComponentInterface {
    uint256 constant private ORACLE_PAYMENT = 1 * LINK;
    uint256 public currentPrice;
    uint public lastUpdateTime;
    int256 public changeDay;
    bytes32 public lastMarket;

    string public name = "ChainlinkOracle";
    string public description = "ChainlinkOracle";
    string public category = "ORACLE";
    string public version = "1.0";



    event RequestEthereumPriceFulfilled(
      bytes32 indexed requestId,
      uint256 indexed price
    );

    event RequestEthereumChangeFulfilled(
      bytes32 indexed requestId,
      int256 indexed change
    );

    event RequestEthereumLastMarket(
      bytes32 indexed requestId,
      bytes32 indexed market
    );

    address constant ROPSTEN_ENS = 0x112234455C3a32FD11230C42E7Bccd4A84e02010;
    bytes32 constant ROPSTEN_CHAINLINK_ENS = 0xead9c0180f6d685e43522fcfe277c2f0465fe930fb32b5b415826eacf9803727;

    constructor() Ownable() public {
        addwhitelist(msg.sender);
    }

    function getCurrentPrice() public view returns(uint256){return currentPrice;}
    function getLastUpdateTime() public view returns(uint256){return lastUpdateTime;}


    //Fund this contract
    //https://ropsten.chain.link/

    //string _jobId, string _currency
    //"587948181f6248dbbb8599f949f977c6", "USD"
    function requestEthereumPrice(string _jobId, string _currency) 
      public
      onlywhitelist
    {
        ChainlinkLib.Run memory run = newRun(stringToBytes32(_jobId), this, this.fulfillEthereumPrice.selector);
        run.add("url", "https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD,EUR,JPY");
        string[] memory path = new string[](1);
        path[0] = _currency;
        run.addStringArray("path", path);
        run.addInt("times", 100);
        chainlinkRequest(run, ORACLE_PAYMENT);
    }

    function requestEthereumChange(string _jobId, string _currency)
      public
      onlyOwner
    {
        ChainlinkLib.Run memory run = newRun(stringToBytes32(_jobId), this, this.fulfillEthereumChange.selector);
        run.add("url", "https://min-api.cryptocompare.com/data/pricemultifull?fsyms=ETH&tsyms=USD,EUR,JPY");
        string[] memory path = new string[](4);
        path[0] = "RAW";
        path[1] = "ETH";
        path[2] = _currency;
        path[3] = "CHANGEPCTDAY";
        run.addStringArray("path", path);
        run.addInt("times", 1000000000);
        chainlinkRequest(run, ORACLE_PAYMENT);
    }

    function requestEthereumLastMarket(string _jobId, string _currency)
      public
      onlyOwner
    {
        ChainlinkLib.Run memory run = newRun(stringToBytes32(_jobId), this, this.fulfillEthereumLastMarket.selector);
        run.add("url", "https://min-api.cryptocompare.com/data/pricemultifull?fsyms=ETH&tsyms=USD,EUR,JPY");
        string[] memory path = new string[](4);
        path[0] = "RAW";
        path[1] = "ETH";
        path[2] = _currency;
        path[3] = "LASTMARKET";
        run.addStringArray("path", path);
        chainlinkRequest(run, ORACLE_PAYMENT);
    }

    function fulfillEthereumPrice(bytes32 _requestId, uint256 _price)
      public
      checkChainlinkFulfillment(_requestId)
    {
        emit RequestEthereumPriceFulfilled(_requestId, _price);

        currentPrice = _price;
        lastUpdateTime = now;
    }

    function fulfillEthereumChange(bytes32 _requestId, int256 _change)
      public
      checkChainlinkFulfillment(_requestId)
    {
        emit RequestEthereumChangeFulfilled(_requestId, _change);
        changeDay = _change;
    }

    function fulfillEthereumLastMarket(bytes32 _requestId, bytes32 _market)
      public
      checkChainlinkFulfillment(_requestId)
    {
        emit RequestEthereumLastMarket(_requestId, _market);
        lastMarket = _market;
    }

    function setRopstenChainlinkAddresses() public onlyOwner {
        newChainlinkWithENS(ROPSTEN_ENS, ROPSTEN_CHAINLINK_ENS);
    }

    function setChainlinkAddresses(address _ENS,bytes32 _chainlinkENS) public onlyOwner {
        newChainlinkWithENS(_ENS, _chainlinkENS);
    }

    function getChainlinkToken() public view returns (address) {
        return chainlinkToken();
    }
    
    function getOracle() public view returns (address) {
        return oracleAddress();
    }

    function withdrawLink() public onlyOwner {
        LinkTokenInterface link = LinkTokenInterface(chainlinkToken());
        require(link.transfer(msg.sender, link.balanceOf(address(this))), "Unable to transfer");
    }

    function stringToBytes32(string memory source) private pure returns (bytes32 result) {
        bytes memory tempEmptyStringTest = bytes(source);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
      }

        assembly {
          result := mload(add(source, 32))
        }
    }

    //Management Function 
    mapping(address => bool) whiteList;
    function addwhitelist(address _controller) public onlyOwner returns(bool){
        whiteList[_controller] = true;
        return true;
    }
    function delwhitelist(address _controller) public onlyOwner returns(bool){
        whiteList[_controller] = false;
        return true;
    }

    modifier onlywhitelist() {
        require(whiteList[msg.sender],"98");
        _;
    }


}