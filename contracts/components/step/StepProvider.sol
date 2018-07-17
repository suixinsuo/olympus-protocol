pragma solidity 0.4.24;

import "../../interfaces/StepInterface.sol";

contract StepProvider is StepInterface {
    string public name = "StepProvider";
    string public description = "Allow a function execution to span multiple transactions";
    string public category = "Steps";
    string public version = "1.0";
    mapping (address => mapping(bytes32 => uint)) public stepAmount;
    mapping (address => mapping(bytes32 => uint)) public stepStatus;
    mapping (address => mapping(bytes32 => uint)) public currentCallStepIndex;
    mapping (address => mapping(bytes32 => uint)) public currentFunctionStepIndex;

    function initializeOrContinue(bytes32 _category, uint _stepAmount) external returns (uint _currentFunctionStep){
        stepAmount[msg.sender][_category] = _stepAmount;
        if(stepStatus[msg.sender][_category] == 0){
            stepStatus[msg.sender][_category] = 1;
        }
        return currentFunctionStepIndex[msg.sender][_category];
    }

    function getStatus(bytes32 _category) external view returns (uint status) {
        return stepStatus[msg.sender][_category];
    }

    function updateStatus(bytes32 _category) external returns (bool success) {
        stepStatus[msg.sender][_category]++;
        currentFunctionStepIndex[msg.sender][_category] = 0;
        return true;
    }

    function goNextStep(bytes32 _category) external returns (bool shouldReturn) {
        currentCallStepIndex[msg.sender][_category]++;
        currentFunctionStepIndex[msg.sender][_category]++;
        if(currentCallStepIndex[msg.sender][_category] > stepAmount[msg.sender][_category]){
            currentCallStepIndex[msg.sender][_category] = 0;
            return true;
        }
        return false;
    }

    function finalize(bytes32 _category) external returns (bool success) {
        currentCallStepIndex[msg.sender][_category] = 0;
        currentFunctionStepIndex[msg.sender][_category] = 0;
        stepStatus[msg.sender][_category] = 0;
        return true;
    }

}
