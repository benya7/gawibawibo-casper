import { Anchor, Box, Button, Header, Layer, ResponsiveContext, Text, Select, Paragraph } from 'grommet';
import { Apps, Close } from 'grommet-icons';
import React, { useContext, useState } from 'react';
import { useSnapshot } from 'valtio';
import { appState } from '../App';
import { History } from './History';
import { Signer } from 'casper-js-sdk';

const ConnectBox = ({ size, activePublicKey, isLogged, explorerUrl }) => {
  return <Box direction={size !== 'large' ? 'column' : 'row'} align='center' justify='center' gap='small'>
    {isLogged &&
      <Anchor
        target='_blank'
        href={`${explorerUrl}/account/${activePublicKey}`}
        label={activePublicKey && `${activePublicKey.substring(0, 6)}...${activePublicKey.substring(activePublicKey.length - 6)}`}
        size='small'
      />}
    {isLogged ?
      (
        <Button label={'disconnect'} size='small' onClick={() => {
          window.casperlabsHelper.disconnectFromSite();
          window.location.reload();
        }} />
      ) :
      (
        <Button label={'connect'} size='small' onClick={() => {
          window.casperlabsHelper.requestConnection()
        }} />
      )
    }
  </Box>
}

const ResponsiveMenu = ({ toggleHistory, size }) => {
  const { activePublicKey, isLogged, explorerUrl, themeMode, casperSignerInstalled } = useSnapshot(appState);
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
          <Box gap='xlarge' background='c1' align='center' pad={{ top: 'xlarge' }} justify='start' flex>
            <Close onClick={toggleMenu} size='small' />
            <Button
              disabled={isLogged ? false : true}
              label='my moves history'
              size='small'
              margin={{ horizontal: 'large' }}
              onClick={toggleHistory}
            />
            <ConnectBox
              size={size}
              activePublicKey={activePublicKey}
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

const Faq = () => {

  return <Box align='center' pad='small' overflow={{ vertical: 'scroll'}}>
    <Text weight='bold' size='large'>Faq</Text>
    <Box gap='small'>
      <Text size='small'>How work it the game?</Text>
      <Box border flex overflow={{vertical: 'scroll'}} pad='small'>
        <Text size='small'>
          The game is the famous rock, paper, scissors (gawi, bawi, bo).
          It works in the following way.
          Each "move" consists of a combination of 3 rock, paper, scissors options (gawi, bawi, bo).
          Rock (gawi), beats Scissors (bo) and loses to Paper (bawi).
          Paper (bawi), beat Rock (gawi) and lose to Scissors (bo).
          Scissors (bo), beats Paper (bawi) and loses to Rock (gawi).
        </Text>
      </Box>
      <Text size='small'>How to Play?</Text>
      <Box border flex overflow={{vertical: 'scroll'}} pad='small'>
        <Text size='small'>
          There are two ways to play, the first is to create a new "move" and the second is to play an existing "move".
          To create a new one, in the left panel, select your combination of 3 options and then press the Submit button.
          In the panel on the right, the unplayed "moves" will appear, yours and those of the rest of the players.
          Your own moves give you the option to cancel, unlike other players' moves the Play button. You press that button and choose your combination of 3 options, then the Submit button.
        </Text>
      </Box>
      {/* <Text size='small'>How to Play?</Text>
      <Box border flex overflow={{vertical: 'scroll'}} pad='small'>
        <Text size='small'>
          There are two ways to play, the first is to create a new "move" and the second is to play an existing "move".
          To create a new one, in the left panel, select your combination of 3 options and then press the Submit button.
          In the panel on the right, the unplayed "moves" will appear, yours and those of the rest of the players.
          Your own moves give you the option to cancel, unlike other players' moves the Play button. You press that button and choose your combination of 3 options, then the Submit button.
        </Text>
      </Box> */}
    </Box>
  </Box>
}


const Nav = () => {
  const size = useContext(ResponsiveContext);
  const { activePublicKey, isLogged, explorerUrl, themeMode, env } = useSnapshot(appState);
  const [openHistory, setOpenHistory] = useState(false);
  const [openFaq, setOpenFaq] = useState(false);
  const toggleFaq = () => setOpenFaq((value) => !value);
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
      options={['casper', 'casper-test']}
      onChange={({ option }) => {
        appState.env = option;
        localStorage.setItem('env', option);
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
        openFaq && (
          <Layer position='center'  onClickOutside={toggleFaq} onEsc={toggleFaq}>
            <Box align='center' pad='medium' gap='small'>
              <Close onClick={toggleFaq} size='small' />
              <Faq />
            </Box>
          </Layer>
        )
      }
      {
        size === 'small' ? (
          <ResponsiveMenu toggleHistory={toggleHistory} size={size} />
        ) : (
          <Box gap={size !== 'large' ? 'small' : 'medium'} direction='row' align='center'>
            <Button
              label='faq'
              size='small'
              onClick={toggleFaq}
              margin={{ horizontal: size === 'medium' ? 'small' : 'medium' }}
            />
            <Button
              disabled={isLogged ? false : true}
              label='my moves history'
              size='small'
              onClick={toggleHistory}
              margin={{ horizontal: size === 'medium' ? 'small' : 'medium' }}
            />
            <ConnectBox
              size={size}
              activePublicKey={activePublicKey}
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
