pragma solidity 0.4.24;

import "../../interfaces/StepInterface.sol";
import "../../interfaces/ComponentInterface.sol";

import "zeppelin-solidity/contracts/ownership/Ownable.sol";

contract StepProvider is StepInterface, ComponentInterface, Ownable {
    string public name = "StepProvider";
    string public description = "Allow a function execution to span multiple transactions";
    string public category = "Steps";
    string public version = "1.0";

    mapping (address => mapping(bytes32 => uint)) public maxCalls; // Max
    mapping (address => mapping(bytes32 => uint)) public status; //
    mapping (address => mapping(bytes32 => uint)) public currentCallStep; // Will be reseted in a new call
    mapping (address => mapping(bytes32 => uint)) public currentFunctionStep; // Keeps the counter between calls

    function setMaxCalls(bytes32 _category, uint _maxCalls) external {
        require( _maxCalls > 0);
        maxCalls[msg.sender][_category] = _maxCalls;
    }

    function setMultipleMaxCalls(bytes32[] _categories, uint[] _maxCallsList) external {
        for(uint i =0 ; i < _categories.length;i ++) {
            require( _maxCallsList[i] > 0);
            maxCalls[msg.sender][_categories[i]] = _maxCallsList[i];
        }
    }

    function getMaxCalls(bytes32 _category) external view returns(uint _maxCall) {
        return maxCalls[msg.sender][_category];
    }

    function initializeOrContinue(bytes32 _category) external returns (uint _currentFunctionStep){
        require(  maxCalls[msg.sender][_category] > 0);
        currentCallStep[msg.sender][_category] = 0;

        if(status[msg.sender][_category] == 0) { // Status 0 is not started
            status[msg.sender][_category] = 1;
        }
        return currentFunctionStep[msg.sender][_category];
    }

    function getStatus(bytes32 _category) external view returns (uint _currentStatus) {
        return status[msg.sender][_category];
    }

    function updateStatus(bytes32 _category) external returns (uint) {
        status[msg.sender][_category]++;
        currentFunctionStep[msg.sender][_category] = 0;
        return status[msg.sender][_category];
    }

    function goNextStep(bytes32 _category) external returns (bool _shouldCallAgain) {
        if(currentCallStep[msg.sender][_category] >= maxCalls[msg.sender][_category]){
            return false;
        }
        currentCallStep[msg.sender][_category]++;
        currentFunctionStep[msg.sender][_category]++;

        return true;
    }

    function finalize(bytes32 _category) external returns (bool success) {
        currentCallStep[msg.sender][_category] = 0;
        currentFunctionStep[msg.sender][_category] = 0;
        status[msg.sender][_category] = 0;
        return true;
    }

}
