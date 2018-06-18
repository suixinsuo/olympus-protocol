
pragma solidity 0.4.24;

import "../../contracts/components/mocks/MockDerivative.sol";
import "../../contracts/components/withdraw/AsyncWithdraw.sol";

contract MockWithdrawClient is MockDerivative  {
    uint maxTransfers = 1;
    AsyncWithdraw asyncWithdraw;

    constructor (address _asyncWithdraw) public {
        asyncWithdraw = AsyncWithdraw(_asyncWithdraw);
        balances[address(this)] = 10**25;
    }

    function requestWithdraw(uint amount) external {
        asyncWithdraw.request(msg.sender, amount);
    }

    function withdraw() onlyOwner external returns(bool) {
        uint _transfers = 0;
        address[] memory _requests = asyncWithdraw.getUserRequests();
        uint _eth;
        uint tokens;

        if(!asyncWithdraw.isInProgress()) {
            asyncWithdraw.start();
        }

        for(uint8 i = 0; i < _requests.length && _transfers < maxTransfers ; i++) {

            (_eth, tokens) = asyncWithdraw.withdraw(_requests[i]);
            if(tokens == 0) {continue;}

            balances[_requests[i]] -= tokens;
            totalSupply -= tokens;
            address(_requests[i]).transfer(_eth);
            _transfers++;
        }

        if(!asyncWithdraw.isInProgress()) {
            asyncWithdraw.unlock();
        }

        return !asyncWithdraw.isInProgress(); // True if completed
    }

    function withdrawInProgress() external view returns(bool) {
        return asyncWithdraw.isInProgress();
    }

    function invest() public payable  returns(bool) {
        balances[msg.sender] += msg.value; // 1 ETH 1 Fund Token
        totalSupply += msg.value;
        emit Transfer(owner, msg.sender, msg.value);
        return true;
    }



}

