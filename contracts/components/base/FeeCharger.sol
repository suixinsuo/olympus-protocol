pragma solidity 0.4.24;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "../../interfaces/DerivativeInterface.sol";
import "../../interfaces/FeeChargerInterface.sol";
import "../../libs/ERC20Extended.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";


contract FeeCharger is Ownable, FeeChargerInterface {
    using SafeMath for uint256;

    FeeMode public feeMode = FeeMode.ByCalls;
    uint public feePercentage = 0;
    uint public feeAmount = 0;
    uint constant public FEE_CHARGER_DENOMINATOR = 10000;
    address private olympusWallet = 0x09227deaeE08a5Ba9D6Eb057F922aDfAd191c36c;
    bool private isPaying = false;

    event LogU(string msg, uint value);

    enum FeeMode {
        ByTransactionAmount,
        ByCalls
    }

    modifier feePayable(uint _amount) {
      emit LogU("Amount in modifier", _amount);
      uint fee = calculateFee(_amount);
      emit LogU("Fee amount in modifier", fee);
      DerivativeInterface derivative = DerivativeInterface(msg.sender);
      // take money directly from the derivative.
      require(MOT.balanceOf(address(derivative)) >= fee);
      require(MOT.allowance(address(derivative), address(this)) >= fee);
      _;
    }

    function calculateFee(uint _amount) public view returns (uint amount) {
        uint fee;
        if (feeMode == FeeMode.ByTransactionAmount) {
            fee = _amount * feePercentage / FEE_CHARGER_DENOMINATOR;
        } else if (feeMode == FeeMode.ByCalls) {
            fee = feeAmount;
        } else {
          revert("Unsupported fee mode.");
        }

        return fee;
    }    

    function adjustFeeMode(FeeMode _newMode) public onlyOwner returns (bool success) {
        feeMode = _newMode;
        return true;
    }

    function adjustFeeAmount(uint _newAmount) public onlyOwner returns (bool success) {
        feeAmount = _newAmount;
        return true;
    }    

    function adjustFeePercentage(uint _newPercentage) public onlyOwner returns (bool success) {
        require(_newPercentage <= FEE_CHARGER_DENOMINATOR);
        feePercentage = _newPercentage;
        return true;
    }    

    function setWalletId(address _newWallet) public onlyOwner returns (bool success) {
        require(_newWallet != 0x0);
        olympusWallet = _newWallet;
        return true;
    }

    function setMotAddress(address _motAddress) public onlyOwner returns (bool success) {
        require(_motAddress != 0x0);
        require(_motAddress != address(MOT));
        MOT = ERC20Extended(_motAddress);
        // this is only and will always be MOT.
        require(keccak256(abi.encodePacked(MOT.symbol())) == keccak256(abi.encodePacked("MOT")));

        return true;
    }


    /*
     * @dev Pay the fee for the call / transaction.
     * Depending on the component itself, the fee is paid differently.
     * @param uint _amountinMot The base amount in MOT, calculation should be one outside. 
     * this is only used when the fee mode is by transaction amount. leave it to zero if fee mode is
     * by calls.
     * @return boolean whether or not the fee is paid.
     */
     
    function payFee(uint _amountInMOT) internal feePayable(calculateFee(_amountInMOT)) returns (bool success) {
        uint _feeAmount = calculateFee(_amountInMOT);
        emit LogU("Amount in payFee", _feeAmount);

        DerivativeInterface derivative = DerivativeInterface(msg.sender);
        // address owner = derivative.owner();    

        uint balanceBefore = MOT.balanceOf(olympusWallet);
        emit LogU("balanceBefore", balanceBefore);
        require(!isPaying);
        isPaying = true;
        MOT.transferFrom(address(derivative), olympusWallet, _feeAmount);
        isPaying = false;
        uint balanceAfter = MOT.balanceOf(olympusWallet);
        emit LogU("balanceAfter", balanceAfter);

        require(balanceAfter == balanceBefore + _feeAmount);   
        return true;     
    }        
}
