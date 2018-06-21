module.exports = {
  roundTo: (value, decimals) => {
    return Math.round((10 ** decimals) * value) / (10 ** decimals);
  },

  ethBalance: async (address) => {
    return parseFloat(web3.fromWei(await web3.eth.getBalance(address).toNumber(), 'ether'), 10);
  }


}
