pragma solidity 0.4.24;

contract StepProvider {
    mapping (address => mapping(string => uint)) public stepAmount;
    mapping (address => mapping(string => uint)) public stepStatus;
    mapping (address => mapping(string => uint)) public currentCallStep;
    mapping (address => mapping(string => uint)) public currentFunctionStep;

    function initialize(string category, uint _stepAmount) public returns (uint _currentFunctionStep){
        stepAmount[msg.sender][category] = _stepAmount;
        if(stepStatus[msg.sender][category] == 0){
            stepStatus[msg.sender][category] = 1;
        }
        return currentFunctionStep[msg.sender][category];
    }

    function getStatus(string category) public returns (uint status) {
        return stepStatus[msg.sender][category];
    }

    function updateStatus(string category) public returns (bool success) {
        stepStatus[msg.sender][category]++;
        currentFunctionStep[msg.sender][category] = 0;
        return true;
    }

    function nextStep(string category) public returns (bool shouldReturn) {
        currentCallStep[msg.sender][category]++;
        currentFunctionStep[msg.sender][category]++;
        if(currentCallStep[msg.sender][category] > stepAmount[msg.sender][category]){
            currentCallStep[msg.sender][category] = 0;
            return true;
        }
        return false;
    }

    function finalize(string category) public returns (bool success) {
        currentCallStep[msg.sender][category] = 0;
        currentFunctionStep[msg.sender][category] = 0;
        stepStatus[msg.sender][category] = 0;
        return true;
    }

}
