import { Box, Button, Layer, List, RadioButtonGroup, ResponsiveContext, Notification, Text, TextInput, Card, Avatar } from 'grommet';
import { Close } from 'grommet-icons'
import React, { useContext, useState } from 'react';
import { Play } from './Play';
import { utils } from 'near-api-js';
import { useSnapshot } from 'valtio';
import { appState } from '../App';
import { sha256 } from 'js-sha256';
import { sha3_256 } from 'js-sha3';


const optionsValues = [
  process.env.REACT_APP_VALUES_OPTION1,
  process.env.REACT_APP_VALUES_OPTION2,
  process.env.REACT_APP_VALUES_OPTION3,
]


const Main = () => {
  const size = useContext(ResponsiveContext);
  const [blends, setBlends] = useState({ b1: "", b2: "", b3: "" });
  const [amount, setAmount] = useState('0.1');
  const [openPlay, setOpenPlay] = useState(false);
  const { accountId, isLogged, unplayedMoves, contract, balance } = useSnapshot(appState);
  const [errorBalance, setErrorBalance] = useState(false);
  const [playTarget, setPlayTarget] = useState({})

  const handlePlay = (id, amountPrize) => {
    setPlayTarget({ id: id, amount: amountPrize })
    setOpenPlay((value) => !value)
  };
  const handleCancel = (id) => {
    contract.cancel_move({ "id": id })
  };
  const handleClean = () => {
    setBlends({ b1: "", b2: "", b3: "" })
    setAmount("0")
  };
  const handleSubmit = () => {
    const attachedAmount = utils.format.parseNearAmount(amount);
    if (parseFloat(balance) > parseFloat(attachedAmount) && parseFloat(amount) >= 0.1 && parseFloat(amount) <= 1000000) {
      const id = Math.floor(Math.random() * Date.now()) % 4294967296;
      const { allKeys } = JSON.parse(localStorage.getItem('gawibawibo_wallet_auth_key'));
      const b_signature = sha3_256(blends.b1 + blends.b2 + blends.b3).slice(0, 10)
      const blend = sha256(b_signature + allKeys[0]);
      contract.new_move({
        args: { id: id.toString(), hb: blend },
        amount: attachedAmount
      });
    } else {
      setErrorBalance(true)
      setTimeout(() => {
        setErrorBalance(false)
      }, 4000);
    }
  };

  return <Box
    gap='medium'
    align='center'
    pad='medium'
    direction={size === 'small' ? 'column' : 'row'}
  >
    <Box
      background='c1'
      align='center'
      height={{ min: '450px', max: '450px' }}
      pad={size === 'small' ? 'large' : 'medium'}
      gap={size === 'small' ? 'large' : 'medium'}
      border={{ color: 'c2' }}
      fill
    >
      <Text>make a new move!</Text>
      <Text>chooise a blend:</Text>
      <Options blends={blends} setBlends={setBlends} isLogged={isLogged} />
      {
        errorBalance &&
        <Notification title="Insufficient balance" status='warning' onClose={() => { setErrorBalance(false) }} />
      }
      <Box direction='row' align='center' gap='small'>
        <Text margin={{ right: 'medium' }}>amount</Text>
        <TextInput
          disabled={isLogged ? false : true}
          type='number'
          min='0.1'
          max='1000000'
          step='0.1'
          size='small'
          textAlign='end' value={amount}
          onChange={(e) => {
            setAmount(e.target.value)
          }}
        />
      </Box>
      <Box direction='row' alignSelf='end' gap='medium' pad={{ right: 'large' }}>
        <Button
          onClick={handleClean}
          label="clear"
          disabled={isLogged ? false : true}
        />
        <Button
          onClick={handleSubmit}
          label="submit"
          disabled={isLogged && amount > 0 && blends.b1 !== '' && blends.b2 !== '' && blends.b3 !== '' ? false : true}
        />
      </Box>
    </Box>
    <Box
      background='c1'
      align='center'
      height={{ min: '450px', max: '450px' }}
      pad={size === 'small' ? 'large' : 'medium'}
      gap={size === 'small' ? 'large' : 'medium'}
      border={{ color: 'c2' }}
      fill>
      <Text>unplayed moves</Text>
      <Box gap='medium' direction={size === 'small' ? 'column' : 'row'} align='center'>
        <Text size='small'>id</Text>
        <Text size='small'>owner</Text>
        <Text size='small'>prize</Text>
        <Text size='small'>play</Text>
      </Box>
      {
        unplayedMoves.length > 0 ?
          (
            <List
              data={unplayedMoves}
              primaryKey='id'
              paginate={{ size: 'small' }}
              step={5}
              action={(move) => (
                <ActionButton
                  key={move.id}
                  move={move}
                  accountId={accountId}
                  handleCancel={handleCancel}
                  handlePlay={handlePlay}
                />
              )}>
              {(item) => (
                <Box
                  key={item.id}
                  gap='small'
                  direction={size === 'small' ? 'column' : 'row'}
                  align='center'
                  justify='between'
                >
                  <Text size='small'>{item.id}</Text>
                  <Text size='small'>{item.owner}</Text>
                  <Text size='small'>{utils.format.formatNearAmount(item.prize)} NEAR</Text>
                </Box>
              )}
            </List>
          )
          :
          (
            <Card pad='small' size='small' background='c4' elevation='none' border>
              {
                isLogged ?
                  (<Text size='small'>There are no moves here.</Text>)
                  :
                  (<Text size='small'>Please login to view unplayed moves.</Text>)
              }
            </Card>
          )
      }
    </Box>
    {
      openPlay && (
        <Layer
          position="center"
          margin="medium"
          responsive
          modal
          full="vertical"
          onClickOutside={handlePlay}
          onEsc={handlePlay}
        >
          <Box gap='medium' align='center' pad='medium'>
            <Close onClick={handlePlay} size='small' />
            <Play playTarget={playTarget} contract={contract} size={size} />
          </Box>
        </Layer>
      )
    }
  </Box >
};

export const Options = ({ blends, setBlends, isLogged }) => {

  return <Box gap='small' border={{ color: 'c2' }} pad='small'>
    <RadioButtonGroup
      name='blend1'
      options={[
        { label: <Avatar src={'/gawibawibo/rock-icon-grey.png'} size='small' />, value: optionsValues[0] },
        { label: <Avatar src={'/gawibawibo/paper-icon-grey.png'} size='small' />, value: optionsValues[1] },
        { label: <Avatar src={'/gawibawibo/scissors-icon-grey.png'} size='small' />, value: optionsValues[2] },
      ]}
      value={blends.b1}
      onChange={(e) => setBlends({ ...blends, b1: e.target.value })}
      direction='row'
      disabled={isLogged ? false : true}
    />
    <RadioButtonGroup
      name='blend2'
      options={[
        { label: <Avatar src={'/gawibawibo/rock-icon-grey.png'} size='small' />, value: optionsValues[0] },
        { label: <Avatar src={'/gawibawibo/paper-icon-grey.png'} size='small' />, value: optionsValues[1] },
        { label: <Avatar src={'/gawibawibo/scissors-icon-grey.png'} size='small' />, value: optionsValues[2] },
      ]}
      value={blends.b2}
      onChange={(e) => setBlends({ ...blends, b2: e.target.value })}
      direction='row'
      disabled={isLogged ? false : true}
    />
    <RadioButtonGroup
      name='blend3'
      options={[
        { label: <Avatar src={'/gawibawibo/rock-icon-grey.png'} size='small' />, value: optionsValues[0] },
        { label: <Avatar src={'/gawibawibo/paper-icon-grey.png'} size='small' />, value: optionsValues[1] },
        { label: <Avatar src={'/gawibawibo/scissors-icon-grey.png'} size='small' />, value: optionsValues[2] },
      ]}
      value={blends.b3}
      onChange={(e) => setBlends({ ...blends, b3: e.target.value })}
      direction='row'
      disabled={isLogged ? false : true}
    />
  </Box>
}

const ActionButton = ({ move, accountId, handleCancel, handlePlay }) => {

  if (move.owner === accountId) {
    return <Button label='cancel' size='small' onClick={() => handleCancel(move.id)} />
  } else {
    return <Button label='play' size='small' onClick={() => handlePlay(move.id, move.prize)} />
  }

}

export default Main;
