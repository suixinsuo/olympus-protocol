pragma solidity 0.4.24;

interface StepInterface {
    // This function initializes the piecemeal function. If it is already initialized, it will continue and return the currentFunctionStep of the status.
    function initializeOrContinue(bytes32 _category, uint _stepAmount) external returns (uint _currentFunctionStep);
    // Return the current status of the piecemeal function. This status can be used to decide what can be done
    function getStatus(bytes32 _category) external view returns (uint _status);
    // Update the status to the following phase
    function updateStatus(bytes32 _category) external returns (bool _success);
    // This function should always be called for each operation which is deemed to cost the gas.
    function goNextStep(bytes32 _category) external returns (bool _shouldCallAgain);
    // This function should always be called at the end of the function, when everything is done. This resets the variables to default state.
    function finalize(bytes32 _category) external returns (bool _success);
}
