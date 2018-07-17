pragma solidity 0.4.24;

import "../../interfaces/StepInterface.sol";

contract StepProvider is StepInterface {
    mapping (address => mapping(bytes32 => uint)) public maxCalls;
    mapping (address => mapping(bytes32 => uint)) public status;
    mapping (address => mapping(bytes32 => uint)) public currentCallStepIndex;
    mapping (address => mapping(bytes32 => uint)) public currentFunctionStepIndex;

    function initializeOrContinue(bytes32 _category, uint _maxCalls) external returns (uint _currentFunctionStep){
        maxCalls[msg.sender][_category] = _maxCalls;
        currentCallStepIndex[msg.sender][_category] = 0;

        if(status[msg.sender][_category] == 0) { // Status 0 is not started
            status[msg.sender][_category] = 1;
        }
        return currentFunctionStepIndex[msg.sender][_category];
    }

    function getStatus(bytes32 _category) external view returns (uint currentStatus) {
        return status[msg.sender][_category];
    }

    function updateStatus(bytes32 _category) external returns (bool success) {
        status[msg.sender][_category]++;
        currentFunctionStepIndex[msg.sender][_category] = 0;
        return true;
    }

    function goNextStep(bytes32 _category) external returns (bool shouldCallAgain) {
        if(currentCallStepIndex[msg.sender][_category] >= maxCalls[msg.sender][_category]){
            return true;
        }
        currentCallStepIndex[msg.sender][_category]++;
        currentFunctionStepIndex[msg.sender][_category]++;

        return false;
    }

    function finalize(bytes32 _category) external returns (bool success) {
        currentCallStepIndex[msg.sender][_category] = 0;
        currentFunctionStepIndex[msg.sender][_category] = 0;
        status[msg.sender][_category] = 0;
        return true;
    }

}
