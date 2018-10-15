pragma solidity 0.4.24;

import "chainlink/solidity/contracts/Chainlinked.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract LinkTest is Chainlinked, Ownable {
    bytes32 constant SPEC_ID = bytes32("df8d0c29eb26488585444289d74f0019");
    uint public price;
    event PriceReceived(uint price);
    
    constructor() public {
        setLinkToken(0x20fE562d797A42Dcb3399062AE9546cd06f63280);
        setOracle(0x05483103cA904BED6252252e61e621B21DBE823b);        
    }
    
    function requestGWAPrice(string _coin)
      public
      onlyOwner
      returns (bytes32 requestId) 
    {
      ChainlinkLib.Run memory run = newRun(SPEC_ID, this, "fulfill(bytes32,uint256)");
      run.add("endpoint", "gwa-historic");
      run.add("coin", _coin);
      string[] memory path = new string[](3);
      path[0] = "data";
      path[1] = "0";
      path[2] = "1";
      run.addStringArray("copyPath", path);
      run.addInt("times", 100);
      requestId = chainlinkRequest(run, LINK(1));
    }   
    
    function fulfill(bytes32 _requestId, uint256 _reportedPrice)
      public checkChainlinkFulfillment(_requestId)
    {
        price = _reportedPrice;
        emit PriceReceived(_reportedPrice);
    }
}