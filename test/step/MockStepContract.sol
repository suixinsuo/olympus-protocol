  pragma solidity 0.4.24;

import "../../contracts/interfaces/StepInterface.sol";

contract MockStepContract {
    StepInterface public stepProvider = StepInterface(0x0);
    uint public someVariable = 0;
    uint public someOtherVariable = 0;
    uint public someEasyVariable = 0;
    uint public stepAmount = 30;

    constructor (StepInterface _stepProvider) public {
        stepProvider = _stepProvider;
    }

    function updateStepAmount(uint _stepAmount) public {
        stepAmount = _stepAmount;
    }

    function doMultipleSteps() public returns (bool completed){
        bytes32 stepsCategory = "ourCategory";
        uint currentFunctionStep = stepProvider.initializeOrContinue(stepsCategory, stepAmount);
        uint i;
        if(stepProvider.getStatus(stepsCategory) == 1) {
            for (i = currentFunctionStep; i < 50; i++) {
                someVariable++;
                if(stepProvider.goNextStep(stepsCategory) == true){
                    return false;
                }
            }
            stepProvider.updateStatus(stepsCategory);
            currentFunctionStep = 0;
        }

        if(stepProvider.getStatus(stepsCategory) == 2){
            for (i = currentFunctionStep; i < 50; i++) {
                someOtherVariable++;
                if(stepProvider.goNextStep(stepsCategory) == true){
                    return false;
                }
            }
        }
        stepProvider.finalize(stepsCategory);
        return true;
    }

    function doEasySteps() public returns (bool completed){
        bytes32 stepsCategory = "ourCategory";
        uint currentFunctionStep = stepProvider.initializeOrContinue(stepsCategory, stepAmount);
        uint i;
        for (i = currentFunctionStep; i < 50; i++) {
            someEasyVariable++;
            if(stepProvider.goNextStep(stepsCategory) == true){
                return false;
            }
        }

        stepProvider.finalize(stepsCategory);
        return true;
    }
}
