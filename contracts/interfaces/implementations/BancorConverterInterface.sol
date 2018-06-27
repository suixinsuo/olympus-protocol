pragma solidity 0.4.24;

import "../../libs/ERC20Extended.sol";

contract BancorConverter {
    string public converterType;
    ERC20Extended[] public quickBuyPath;
    /**
        @dev returns the length of the quick buy path array
        @return quick buy path length
    */
    function getQuickBuyPathLength() public view returns (uint256);
    /**
        @dev returns the expected return for converting a specific amount of _fromToken to _toToken

        @param _fromToken  ERC20 token to convert from
        @param _toToken    ERC20 token to convert to
        @param _amount     amount to convert, in fromToken

        @return expected conversion return amount
    */
    function getReturn(ERC20Extended _fromToken, ERC20Extended _toToken, uint256 _amount) public view returns (uint256);
    /**
        @dev converts the token to any other token in the bancor network by following a predefined conversion path
        note that when converting from an ERC20 token (as opposed to a smart token), allowance must be set beforehand

        @param _path        conversion path, see conversion path format in the BancorNetwork contract
        @param _amount      amount to convert from (in the initial source token)
        @param _minReturn   if the conversion results in an amount smaller than the minimum return - it is cancelled, must be nonzero

        @return tokens issued in return
    */
    function quickConvert(ERC20Extended[] _path, uint256 _amount, uint256 _minReturn)
        public
        payable
        returns (uint256);

}
