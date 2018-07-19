  pragma solidity 0.4.24;

import "../../contracts/interfaces/StepInterface.sol";

contract MockStepContract {
    StepInterface public stepProvider = StepInterface(0x0);
    uint public someVariable = 0;
    uint public someOtherVariable = 0;
    uint public someEasyVariable = 0;
    bytes32 constant CATEGORY = "ourCategory";
    constructor (StepInterface _stepProvider) public {
        stepProvider = _stepProvider;
        stepProvider.setMaxCalls(CATEGORY,30);
    }

    function updateStepAmount(uint _stepAmount) public {
        stepProvider.setMaxCalls(CATEGORY,_stepAmount);
    }

    function doMultipleSteps() public returns (bool completed){

        uint currentFunctionStep = stepProvider.initializeOrContinue(CATEGORY);
        uint i;
        if(stepProvider.getStatus(CATEGORY) == 1) {
            for (i = currentFunctionStep; i < 50 ; i++) {
                if(stepProvider.goNextStep(CATEGORY) == false){
                    return false;
                }
                someVariable++;

            }
            stepProvider.updateStatus(CATEGORY);
            currentFunctionStep = 0;
        }

        if(stepProvider.getStatus(CATEGORY) == 2){
            for (i = currentFunctionStep; i < 50; i++) {
                if(stepProvider.goNextStep(CATEGORY) == false){
                    return false;
                }
                someOtherVariable++;
            }
        }
        stepProvider.finalize(CATEGORY);
        return true;
    }

    function doEasySteps() public returns (bool completed){
        uint currentFunctionStep = stepProvider.initializeOrContinue(CATEGORY);
        uint i;

        for (i = currentFunctionStep; i < 50 && stepProvider.goNextStep(CATEGORY); i++) {
            someEasyVariable++;
        }

        if( i == 50) {
           stepProvider.finalize(CATEGORY);
           // Some extra logic
           return true;
        }

        return false;
    }
}
