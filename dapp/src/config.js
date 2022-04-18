
function getConfig(env) {
  console.log(process.env.REACT_APP_NODE_URL, process.env.REACT_APP_MOVES_SEED_UREF, process.env.REACT_APP_CONTRACT_HASH_MAINNET, process.env.REACT_APP_CONTRACT_HASH_TESTNET)
  switch (env) {
    case 'development':
    case 'mainnet':
      return {
        networkId: 'casper',
        nodeUrl: process.env.REACT_APP_NODE_URL,
        contractPackageHash: process.env.REACT_APP_CONTRACT_HASH_MAINNET,
        movesSeedUref: process.env.REACT_APP_MOVES_SEED_UREF,
        walletUrl: 'https://cspr.live',
        helperUrl: 'https://cspr.live',
        explorerUrl: 'https://cspr.live',
      };
    case 'testnet':
      return {
        networkId: 'casper-test',
        nodeUrl: process.env.REACT_APP_NODE_URL,
        contractPackageHash: process.env.REACT_APP_CONTRACT_HASH_TESTNET,
        movesSeedUref: process.env.REACT_APP_MOVES_SEED_UREF,
        walletUrl: 'https://testnet.cspr.live',
        helperUrl: 'https://testnet.cspr.live',
        explorerUrl: 'https://testnet.cspr.live',
      };
    default:
      throw Error(`Unconfigured environment '${env}'. Can be configured in src/config.js.`);
  }
}

module.exports = getConfig;