import { Anchor, Box, Button, Header, Layer, ResponsiveContext, Text, Select } from 'grommet';
import { Apps, Close } from 'grommet-icons';
import React, { useContext, useState } from 'react';
import { useSnapshot } from 'valtio';
import { appState } from '../App';
import { History } from './History';
import { utils } from 'near-api-js';


const ConnectBox = ({ size, accountId, wallet, isLogged, explorerUrl }) => {
  return <Box direction={size !== 'large' ? 'column' : 'row'} align='center' justify='center' gap='small'>
    {isLogged &&
      <Anchor
        target='_blank'
        href={`${explorerUrl}/accounts/${accountId}`}
        label={accountId}
        size='small'
      />}
    {isLogged ?
      (
        <Button label={'disconnect'} size='small' onClick={() => {
          localStorage.removeItem('gawibawibo_wallet_auth_key');
          window.location.reload()
        }} />
      ) :
      (
        <Button label={'connect'} size='small' onClick={() => {
          wallet.requestSignIn({ successUrl: 'https://en0c-026.github.io/gawibawibo/' })
        }} />
      )
    }
  </Box>
}

const ResponsiveMenu = ({ toggleHistory, size }) => {
  const { accountId, wallet, isLogged, explorerUrl, unclaimedAmount, contract, themeMode } = useSnapshot(appState);
  const [openMenu, setOpenMenu] = useState(false);
  const toggleMenu = () => setOpenMenu((value) => !value);

  return <>
    <Button label={<Apps />} size='medium' onClick={toggleMenu} plain />
    {
      openMenu && (
        <Layer
          modal
          position='center'
          full={false}
          onClickOutside={toggleMenu}
          onEsc={toggleMenu}
        >
          <Box gap='xlarge' background='c1' align='center' pad={{top: 'xlarge'}} justify='start' flex>
            <Close onClick={toggleMenu} size='small' />
            <BoxClaim isLogged={isLogged} contract={contract} unclaimedAmount={unclaimedAmount} />
            <Button
              disabled={isLogged ? false : true}
              label='my moves history'
              size='small'
              margin={{ horizontal: 'large' }}
              onClick={toggleHistory}
            />
            <ConnectBox
              size={size}
              accountId={accountId}
              wallet={wallet}
              isLogged={isLogged}
              explorerUrl={explorerUrl}
            />
            <Select
              id="select"
              size='small'
              name="select"
              value={
                <Box pad={{ left: 'small', vertical: 'xsmall' }}>
                  <Text size='small'>{themeMode}</Text>
                </Box>
              }
              options={['dark', 'light']}
              onChange={({ option }) => {
                appState.themeMode = option
              }}
            >
              {
                (option, _) => (
                  <Box pad={{ left: 'small', vertical: 'xsmall' }}>
                    <Text size='small'>{option}</Text>
                  </Box>
                )
              }
            </Select>
          </Box>
        </Layer>
      )}
  </>
}

const BoxClaim = ({ isLogged, contract, unclaimedAmount }) => {
  const handleClaim = () => {
    contract.withdraw()
  }
  return (<Box pad='xsmall' align='center' border={{ color: 'c2' }}>
    <Text size='small' weight='bold'>unclaimed:</Text>
    <Text size='small' weight='bold'>{utils.format.formatNearAmount(unclaimedAmount)} NEAR</Text>
    <Button
      disabled={isLogged && unclaimedAmount !== '0' ? false : true}
      label='claim'
      size='small'
      onClick={handleClaim}
    />
  </Box>)
}

const Nav = () => {
  const size = useContext(ResponsiveContext);
  const { wallet, accountId, isLogged, explorerUrl, unclaimedAmount, contract, themeMode, env } = useSnapshot(appState);
  const [openHistory, setOpenHistory] = React.useState(false);
  const toggleHistory = () => setOpenHistory((value) => !value);

  return <Header
    background='c4'
    pad={{ horizontal: "2em", vertical: "3em" }}
    margin={{ top: 'small' }}
    height="xsmall"
  >
    <Anchor size='large' href="#" label="GawiBawiBo" />
    <Select
      id="select"
      size='small'
      name="select"
      value={
        <Box pad={{ left: 'small', vertical: 'xsmall' }}>
          <Text size='small'>{env}</Text>
        </Box>
      }
      options={['testnet', 'mainnet']}
      onChange={({ option }) => {
        appState.env = option;
        localStorage.setItem('env', option);
        localStorage.removeItem('gawibawibo_wallet_auth_key');
        window.location.reload();
      }}
    >
      {
        (option, _) => (
          <Box pad={{ left: 'small', vertical: 'xsmall' }}>
            <Text size='small'>{option}</Text>
          </Box>
        )}
    </Select>
    <>
      {
        openHistory && (
          <Layer position='center' modal onClickOutside={toggleHistory} onEsc={toggleHistory}>
            <Box align='center' justify='center' pad='medium' gap='small' flex>
              <Close onClick={toggleHistory} size='small' />
              <History />
            </Box>
          </Layer>
        )
      }
      {
        size === 'small' ? (
          <ResponsiveMenu toggleHistory={toggleHistory} size={size} />
        ) : (
          <Box gap={size !== 'large' ? 'small' : 'medium'} direction='row' align='center'>
            <BoxClaim isLogged={isLogged} contract={contract} unclaimedAmount={unclaimedAmount} />
            <Button
              disabled={isLogged ? false : true}
                label='my moves history'
              size='small'
              onClick={toggleHistory}
              margin={{ horizontal: size === 'medium' ? 'small' : 'medium' }}
            />
            <ConnectBox
              size={size}
              accountId={accountId}
              wallet={wallet}
              isLogged={isLogged}
              explorerUrl={explorerUrl}
            />
            <Select
              id="select"
              size='small'
              name="select"
              value={
                <Box pad={{ left: 'small', vertical: 'xsmall' }}>
                  <Text size='small'>{themeMode}</Text>
                </Box>
              }
              options={['dark', 'light']}
              onChange={({ option }) => {
                localStorage.setItem('theme', option)
                appState.themeMode = option
              }}
            >
              {
                (option, _) => (
                  <Box pad={{ left: 'small', vertical: 'xsmall' }}>
                    <Text size='small'>{option}</Text>
                  </Box>
                )
              }
            </Select>
          </Box>
        )
      }
    </>
  </Header >;
};

export default Nav;
