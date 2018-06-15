
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

    function withdraw() external returns(bool) {
        uint _transfers = 0;
        address[] memory _requests = asyncWithdraw.getUserRequests();
        uint amount =0;
        if(!asyncWithdraw.isInProgress()) {
            asyncWithdraw.start();
        }

        for(uint8 i = 0; i < _requests.length && _transfers < maxTransfers ; i++) {
            amount = asyncWithdraw.withdraw(_requests[i]);
            if(amount == 0) { continue;}
            transfer(_requests[i], amount);
            _transfers++;
        }

        if(!asyncWithdraw.isInProgress()) {
            asyncWithdraw.unlock();
        }

        return asyncWithdraw.isInProgress();
    }

    function () external payable {
        balances[msg.sender] = msg.value; // 1 ETH 1 Fund Token
        emit Transfer(owner, msg.sender, msg.value);
    }



}

