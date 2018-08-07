pragma solidity 0.4.24;

import "../libs/ERC20Extended.sol";

interface TokenBrokenInterface {
    /**
     * @dev Calculate the balance of a token corresponeding to each investor.
     * The Sender is not expected to be a derivative, but a MappeableDerivative.
     * @param _token Token ERC20Extended address
     * @return The list of balances. This information also gets saved internally in a mapping
     */
    
    function calculateBalanceByInvestor(ERC20Extended _token) external returns(uint[]);

  /**
     * @dev Getter of the mapping, to query any balance storaged
     * To be used from javascript or another contract (in second case maybe balancesOf is more gas saving)
     * @param _derivative Derivative which belongs the request
     * @param _token Token that that is being queried
     * @param _investor User address that is being queried
     * @return Current balance
     */
     // TODO : not working the function to getter
    // function tokenBalances(address _derivative, address _token, address _investor) public returns(uint);

    /**
     * @dev  Return the token balances to withdraw or 0.
     * Save gas when quering different tokens at once;
     * To be used from another contract.
     * @param _tokens Array of addresses
     * @param _investor User of whose balance is being queried
     * @return List of the balances mapping the index with the _tokens array, having
     *      value 0 the tokens with no balance
     */
    function tokenBalancesOf(address [] _tokens, address _investor) external returns(uint[]);

     
    /**
     * @dev Returns the amount to withdraw of the investor and reduces it from the provider.
     * Will revert if the balance to reduce is 0. 
     * If you call twice this function, first time it will set to 0, second will revert.
     * In order only to query the balance use balancesOf
     * @param _token token address
     * @param _investor Investor who want to withdraw his broken token
     * @return Yet pending withdraws, the derivate can check if is 0, all is withdrawed
     */
    function withdraw(address _token, address _investor) external returns(uint);

}
