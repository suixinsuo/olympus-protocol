pragma solidity 0.4.24;

import "./OlympusFund.sol";

contract OlympusFund_Fast is OlympusFund {
    using SafeMath for uint256;

    constructor(
      string _name,
      string _symbol,
      string _description,
      bytes32 _category,
      uint _decimals
      ) public OlympusFund(_name, _symbol, _description, _category,  _decimals) {
    }

    // ----------------------------- CONFIG -----------------------------
    // One time call
    function initialize(address _componentList, uint _initialFundFee, uint _withdrawFrequency )
        public onlyOwner payable {

        super.initialize(_componentList,_initialFundFee,_withdrawFrequency);
        fastSetUp();
    }

    /// FAST SET UP CODE
    function fastSetUp() internal {
        address[] memory _botAddress = new address[](1);
        _botAddress[0] = 0x888;
        enableWhitelist(WhitelistKeys.Maintenance, true);
        setAllowed(_botAddress,WhitelistKeys.Maintenance,true);
    }
    ///

}
