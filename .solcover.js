module.exports = {
  // port: 6545,
  copyNodeModules: true,
  // testrpcOptions: '-p 6545 -u 0x54fd80d6ae7584d8e9a19fe1df43f04e5282cc43',
  compileCommand: 'npm run build',
  testCommand: "./node_modules/.bin/run-with-testrpc --port 8545 'truffle test'",
  // norpc: true,
  // dir: './secretDirectory',
  // copyPackages: ['zeppelin-solidity'],
  skipFiles: [
    'TestCore.sol',
    'libs/Converter.sol',
    'libs/Manageable.sol',
    'libs/Math.sol',
    'libs/Ownable.sol',
    'libs/SafeMath.sol',
    'libs/SimpleERC20Token.sol',
    'libs/strings.sol',
    'libs/utils.sol'
  ]
};
