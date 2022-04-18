import React, { useEffect, useState, useCallback, createContext, useContext } from 'react';
import { Grommet, ResponsiveContext, Spinner, Image, Box, Card, Anchor, Text } from 'grommet';
import { Close } from 'grommet-icons';
import { theme } from './layout/theme';
import { useSnapshot } from 'valtio';
import Nav from './components/Nav';
import Container from './components/Container';
import Main from './components/Main';
import FooterApp from './components/FooterApp';
import { proxy } from 'valtio';
import getConfig from './config';
import { CLPublicKey, CasperServiceByJsonRPC } from 'casper-js-sdk';
import { sleepTime } from './utils'


export const appState = proxy({
  env: '',
  themeMode: 'light',
  explorerUrl: '',
  isLogged: false,
  activePublicKey: '',
  accountHash: '',
  unplayedMoves: [],
  currentAccountMoves: [],
  contractHash: '',
  movesSeedUref: '',
  nodeUrl: '',
  lastDeployHash: '',
  executionResults: { status: '', message: '', method: '', loading: true },
  movePlayed: { id: '', winner: '', blendWinner: '', message: '' },
});


export const CasperContext = createContext(undefined);

function App() {
  const [loading, setLoading] = useState(true);

  const { themeMode, isLogged, activePublicKey, nodeUrl, movesSeedUref, accountHash } = useSnapshot(appState);
  const clientRpc = new CasperServiceByJsonRPC(nodeUrl);

  useEffect(() => {
    const env = localStorage.getItem('env') || 'testnet'
    const config = getConfig(env);
    appState.themeMode = localStorage.getItem('theme') || 'light'
    appState.env = config.networkId;
    appState.explorerUrl = config.explorerUrl;
    appState.contractHash = config.contractPackageHash;
    appState.nodeUrl = config.nodeUrl;
    appState.movesSeedUref = config.movesSeedUref;

    window.addEventListener('signer:connected', msg => {
      console.log(msg.detail);
      appState.activePublicKey = msg.detail.activeKey;
      appState.isLogged = msg.detail.isConnected;
    });
    window.addEventListener('signer:disconnected', msg => {
      console.log(msg);
      appState.activePublicKey = msg.detail.activeKey;
      appState.isLogged = msg.detail.isConnected;
    });
    window.addEventListener('signer:tabUpdated', msg => {
      console.log(msg);
      appState.activePublicKey = msg.detail.activeKey;
      appState.isLogged = msg.detail.isConnected;
    });
    window.addEventListener('signer:activeKeyChanged', msg => {
      console.log(msg);
      appState.activePublicKey = msg.detail.activeKey;
      appState.isLogged = msg.detail.isConnected;
    });
    window.addEventListener('signer:locked', msg => {
      console.log(msg);
      appState.activePublicKey = msg.detail.activeKey;
      appState.isLogged = msg.detail.isConnected;
    });
    window.addEventListener('signer:unlocked', msg => {
      console.log(msg);
      appState.activePublicKey = msg.detail.activeKey;
      appState.isLogged = msg.detail.isConnected;
    });
    window.addEventListener('signer:initialState', msg => {
      console.log(msg);
      appState.activePublicKey = msg.detail.activeKey;
      appState.isLogged = msg.detail.isConnected;
    })
  }, [])

  useEffect(() => {
    if (activePublicKey) {

      const publicKey = CLPublicKey.fromHex(activePublicKey);
      appState.accountHash = publicKey.toAccountHashStr().substring(13)
    }
  }, [activePublicKey])

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const getMoves = useCallback(async () => {
    try {
      let stateRootHash = await clientRpc.getStateRootHash();
      let moves = await clientRpc.getDictionaryItemByURef(stateRootHash, 'moves', movesSeedUref)
      let movesParsed = [];
      moves.CLValue.value().map(result => {
        let item = result[1].value();
        let adversaryAccountHash = () => {
          if (!item[1].value()[0].value().unwrapOr(undefined)) {
            return undefined
          } else {
            return item[1].value()[0].value().unwrapOr(undefined).value()
          }
        }
        let adversaryBlendHash = () => {
          if (!item[1].value()[1].value().unwrapOr(undefined)) {
            return undefined
          } else {
            return item[1].value()[1].value().unwrapOr(undefined).value()
          }
        }
        let moveWinner = () => {
          if (!item[2].value()[1].value().unwrapOr(undefined)) {
            return undefined
          } else {
            return item[2].value()[1].value().unwrapOr(undefined).value()
          }
        }

        movesParsed.push(
          {
            id: item[0].value()[0].value().toString(),
            ownerAccountHash: item[0].value()[1].value(),
            ownerBlendHash: item[0].value()[2].value(),
            adversaryAccountHash: adversaryAccountHash(),
            adversaryBlendHash: adversaryBlendHash(),
            status: item[2].value()[0].value(),
            winner: moveWinner(),
          }
        )
      })
      return movesParsed

    } catch (error) {
      console.log(error)
    }
  });

  const checkStatusDeploy = async (hash) => {
    appState.executionResults.loading = true;

    appState.lastDeployHash = hash;
    let statusDeployHash = await clientRpc.getDeployInfo(hash);
    let pending = true;

    while (pending) {
      await sleepTime(10000)
      if (!statusDeployHash.execution_results.length > 0) {

        statusDeployHash = await clientRpc.getDeployInfo(hash);
        console.log(statusDeployHash.execution_results)
      } else {
        pending = false
      }

    }
    return statusDeployHash.execution_results[0].result;
  }
  const checkResultDeploy = (result, method) => {
    appState.executionResults.status = ''
    appState.executionResults.statusMessage = ''
    appState.executionResults.message = ''
    appState.executionResults.method = method

    if (result.Success) {
      appState.executionResults.status = 'success'
      appState.executionResults.statusMessage = 'Transaction success!'
      appState.executionResults.message = `Call to ${method} was executed`
    } else {
      appState.executionResults.status = 'error'
      appState.executionResults.statusMessage = 'Transaction failure!'
      appState.executionResults.message = `Error message: ${result.Failure.error_message}`
    }
  }


  const filterCurrentAccountMoves = useCallback(async () => {
    let moves = await getMoves();
    appState.currentAccountMoves = moves.filter(move => move.status !== 'unplayed' && move.ownerAccountHash == accountHash || move.adversaryAccountHash == accountHash);
  }, [getMoves]);

  const filterUnplayedMoves = useCallback(async () => {
    let moves = await getMoves();
    appState.unplayedMoves = moves.filter(move => move.status == 'unplayed')
  }, [getMoves]);

  const filterMoveForId = async (id) => {
    let moves = await getMoves();
    return moves.find(move => move.id == id)
  };

  return (
    <Grommet theme={theme} themeMode={themeMode} background='c1' full>
      <ResponsiveContext.Consumer>
        {size => (
          <Container size={size !== 'large' ? 'small' : 'large'}>
            {
              loading ?
                (
                  <Box align='center' pad={{ top: 'xlarge' }} margin={{ top: 'xlarge' }}>
                    <Spinner animation={{ type: 'rotateRight', duration: 4000 }} size='xlarge'>
                      <Image src='/gawibawibo-casper/loading.png' />
                    </Spinner>
                  </Box>
                )
                :
                (
                  <>
                    <CasperContext.Provider value={{
                      filterCurrentAccountMoves,
                      filterUnplayedMoves,
                      checkStatusDeploy,
                      checkResultDeploy,
                      filterMoveForId,
                      clientRpc
                    }}>
                      <Nav />
                      {/* {
                        !casperSignerInstalled &&
                        <Card
                          align='center'
                          margin={{ horizontal: 'xlarge' }}
                          pad={{ horizontal: 'small', top: 'small', bottom: 'medium' }}
                          size='small'
                          background='c4'
                          elevation='none'
                          border
                        >
                          <Text size='small'>Casper Signer browser extension is not installed, please install here and refresh the page.</Text>
                          <Anchor
                            size='small'
                            href='https://chrome.google.com/webstore/detail/casper-signer/djhndpllfiibmcdbnmaaahkhchcoijce'
                            target='_blank'
                            label={'Casper Signer Extension'}
                          />
                        </Card>
                      } */}
                      <Main />
                    </CasperContext.Provider>
                    <FooterApp />
                  </>
                )
            }
          </Container>
        )}
      </ResponsiveContext.Consumer>
    </Grommet>
  );
}
export const useCasper = () => useContext(CasperContext);
export default App;
