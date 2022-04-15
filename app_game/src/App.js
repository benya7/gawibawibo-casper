import React, { useEffect, useState } from 'react';
import { Grommet, ResponsiveContext, Spinner, Image, Box, Card, Anchor, Text } from 'grommet';
import { Close } from 'grommet-icons';
import { theme } from './layout/theme';
import { keyStores, connect, Near, WalletConnection, Contract, KeyPair } from 'near-api-js';
import { useSnapshot } from 'valtio';
import Nav from './components/Nav';
import Container from './components/Container';
import Main from './components/Main';
import FooterApp from './components/FooterApp';
import { proxy } from 'valtio';
import getConfig from './config';


const queryParams = new URLSearchParams(window.location.search);
const initNear = async () => {
  const env = localStorage.getItem('env') || 'testnet'
  const theme = localStorage.getItem('theme') || 'light'
  console.log(env)
  const keyStore = new keyStores.BrowserLocalStorageKeyStore();
  const config = getConfig(env);

  const client = await connect({ keyStore, ...config });
  const wallet = new WalletConnection(client, 'gawibawibo');

  return { wallet, client, config, theme };
}

export const appState = proxy({
  env: '',
  themeMode: 'light',
  explorerUrl: '',
  isLogged: false,
  accountId: '',
  balance: '0',
  unplayedMoves: [],
  unclaimedAmount: '0',
  historyMoves: []
});


function App() {
  const [loading, setLoading] = useState(true);
  const [hash, setHash] = useState({ exists: false, url: '' });

  const { themeMode } = useSnapshot(appState);
  useEffect(() => {
    initNear().then(({ wallet, config, theme }) => {
      appState.themeMode = theme;
      appState.wallet = wallet;
      appState.env = config.networkId;
      appState.explorerUrl = config.explorerUrl;

      if (localStorage.getItem('gawibawibo_wallet_auth_key')) {

        appState.accountId = wallet.getAccountId()
        appState.isLogged = true;
        appState.contract = new Contract(
          wallet.account(),
          config.contractName,
          {
            changeMethods: ['new_move', 'cancel_move', 'withdraw', 'play_move'],
            viewMethods: ['moves_of', 'get_unplayed_moves', 'unclaimed_amount_of'],
          }
        )
        wallet.account().getAccountBalance().then((_balance) => {
          appState.balance = _balance.total;
        })

        appState.contract.get_unplayed_moves().then(resp => appState.unplayedMoves = resp)
        appState.contract.unclaimed_amount_of({ account_id: appState.accountId }).then(resp => appState.unclaimedAmount = resp)
        appState.contract.moves_of({ account_id: appState.accountId }).then(resp => appState.historyMoves = resp)

        const hashResponse = queryParams.get('transactionHashes');

        if (hashResponse !== null) setHash({ exists: true, url: `${config.explorerUrl}/transactions/${hashResponse}` })
        const timer = setTimeout(() => {
          setHash({ exists: false, url: '' });
        }, 25000);
        return () => clearTimeout(timer);
      }
    })
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 2500);
    return () => clearTimeout(timer);
  }, []);


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
                      <Image src='/gawibawibo/loading.png' />
                    </Spinner>
                  </Box>
                )
                :
                (
                  <>
                    <Nav />
                    {
                      hash.exists &&
                      <Card
                        align='center'
                        margin={{ horizontal: 'xlarge' }}
                        pad={{ horizontal: 'small', top: 'small', bottom: 'medium' }}
                        size='small'
                        background='c4'
                        elevation='none'
                        border
                      >
                        <Box alignSelf='end'>
                          <Close size='small' onClick={() => setHash({ exists: false, url: '' })} />
                        </Box>
                        <Text>Transaction Receipt</Text>
                        <Anchor
                          size='xsmall'
                          href={hash.url}
                          target='_blank'
                          label={size === 'small' ? `${hash.url.substring(hash.url.length - 44)}` : hash.url}
                        />
                      </Card>
                    }
                    <Main />
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

export default App;
