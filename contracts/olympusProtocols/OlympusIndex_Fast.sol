pragma solidity 0.4.24;

import "./OlympusIndex.sol";

contract OlympusIndex_Fast is OlympusIndex {
    using SafeMath for uint256;


    constructor (
      string _name,
      string _symbol,
      string _description,
      bytes32 _category,
      uint _decimals,
      address[] _tokens,
      uint[] _weights)
      public
      OlympusIndex(_name, _symbol, _description, _category, _decimals, _tokens, _weights) {
    }

    // ----------------------------- CONFIG -----------------------------
    // solhint-disable-next-line
    function initialize(
        address _componentList,
        uint _initialFundFee,
        uint _rebalanceDeltaPercentage
   )
   public onlyOwner payable {

        super.initialize(_componentList, _initialFundFee, _rebalanceDeltaPercentage);
        // Added FAST set up
        fastSetUp();
    }

    /// FAST SET UP CODE
    function fastSetUp() internal {


        uint[] memory _maxSeconds = new uint[](4);
        bytes32[] memory _categories = new bytes32[](4);
        address[] memory _botAddress = new address[](1);
        /// Replace the (888) for the correct values
        _maxSeconds[0] = (111); // Rebalance frequency seconds
        _maxSeconds[1] = (222); // Withdraw frequency seconds
        _maxSeconds[2] = (333); // BuyTokens frequency seconds

        _categories[0] = REBALANCE;
        _categories[1] = WITHDRAW;
        _categories[2] = BUYTOKENS;

        _botAddress[0] = (444); // BOT Address
        setMultipleTimeIntervals(_categories, _maxSeconds);
        enableWhitelist(WhitelistKeys.Maintenance, true);
        setAllowed(_botAddress,WhitelistKeys.Maintenance,true);
    }
    ///

}
