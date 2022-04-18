const CONTRACT_HASH_TESTNET = '729b9ed947aac99d9bd82b11c6adc9a6929cbfce11585fbe9ebdcaba2989e37f';
const CONTRACT_HASH_MAINNET = '729b9ed947aac99d9bd82b11c6adc9a6929cbfce11585fbe9ebdcaba2989e37f';
const MOVES_SEED_UREF = 'uref-60781980063564ad72a7426a75860fe101e5a7784ebb72e12d01e88374f89787-007';

function getConfig(env) {
  switch (env) {
    case 'development':
    case 'mainnet':
      return {
        networkId: 'casper',
        nodeUrl: 'https://65.21.235.219:7777/rpc',
        contractPackageHash: CONTRACT_HASH_MAINNET,
        movesSeedUref: MOVES_SEED_UREF,
        walletUrl: 'https://cspr.live',
        helperUrl: 'https://cspr.live',
        explorerUrl: 'https://cspr.live',
      };
    case 'testnet':
      return {
        networkId: 'casper-test',
        nodeUrl: 'https://65.21.235.219:7777/rpc',
        contractPackageHash: CONTRACT_HASH_TESTNET,
        movesSeedUref: MOVES_SEED_UREF,
        walletUrl: 'https://testnet.cspr.live',
        helperUrl: 'https://testnet.cspr.live',
        explorerUrl: 'https://testnet.cspr.live',
      };
    default:
      throw Error(`Unconfigured environment '${env}'. Can be configured in src/config.js.`);
  }
}

module.exports = getConfig;