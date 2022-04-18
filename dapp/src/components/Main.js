import { Box, Button, Layer, List, RadioButtonGroup, ResponsiveContext, Notification, Text, TextInput, Card, Avatar, Spinner, Anchor } from 'grommet';
import { Close, Refresh } from 'grommet-icons'
import React, { useCallback, useContext, useState, useEffect } from 'react';
import { Play } from './Play';
import { useSnapshot } from 'valtio';
import { appState } from '../App';
import { CLPublicKey, decodeBase16, DeployUtil, RuntimeArgs, CLU32, CLString, Signer } from 'casper-js-sdk';
import { concat } from '@ethersproject/bytes';
import blake from 'blakejs';
import { sha3_256 } from 'js-sha3';
import { toBytesString, toHexString } from '../utils';
import { useCasper } from '../App';

console.log(typeof process.env.REACT_APP_VALUES_OPTION1)
const optionsValues = [
  process.env.REACT_APP_VALUES_OPTION1,
  process.env.REACT_APP_VALUES_OPTION2,
  process.env.REACT_APP_VALUES_OPTION3,
]



const Main = () => {
  const size = useContext(ResponsiveContext);
  const [blends, setBlends] = useState({ b1: "", b2: "", b3: "" });
  const [openPlay, setOpenPlay] = useState(false);
  const [openTransaction, setOpenTransaction] = useState(false);

  const {
    activePublicKey,
    isLogged,
    unplayedMoves,
    contractHash,
    accountHash,
    env,
    explorerUrl,
    executionResults,
    lastDeployHash,
    movePlayed
  } = useSnapshot(appState);
  const [playTarget, setPlayTarget] = useState(0)
  const { 
    filterUnplayedMoves, 
    checkStatusDeploy, 
    checkResultDeploy, 
    filterMoveForId, 
    clientRpc
  } = useCasper();
  const handlePlay = (id) => {
    setPlayTarget(id)
    showPlay()
  };

  const showPlay = () => {
    setOpenPlay(true)
  };
  const hidePlay = () => {
    setOpenPlay(false)
  };

  const showTransaction = () => {
    setOpenTransaction(true)
  };
  const hideTransaction = () => {
    setOpenTransaction(false)
  };

  const handleCancel = useCallback(async (id) => {
    try {
      const contractPackageHash = decodeBase16(contractHash);
      const publicKey = CLPublicKey.fromHex(activePublicKey);
      const deployParams = new DeployUtil.DeployParams(publicKey, env);
      let args = RuntimeArgs.fromMap({
        target_move_id: new CLU32(id)
      });
      const session = DeployUtil.ExecutableDeployItem.newStoredContractByHash(
        contractPackageHash,
        "cancel_move",
        args
      )
      const deployUnsigned = DeployUtil.makeDeploy(
        deployParams,
        session,
        DeployUtil.standardPayment(5000000000)
      );
      const deployJson = DeployUtil.deployToJson(deployUnsigned);
      let signedDeployJSON = await Signer.sign(deployJson, activePublicKey, activePublicKey);
      let signedDeploy = DeployUtil.deployFromJson(signedDeployJSON).unwrap();
      showTransaction();
      let resultDeploy = await clientRpc.deploy(signedDeploy);
      appState.lastDeployHash = resultDeploy.deploy_hash;
      let result = await checkStatusDeploy(resultDeploy.deploy_hash);
      appState.executionResults.loading = false;
      checkResultDeploy(result, 'cancel_move')


    } catch (error) {
      console.log(error)
      console.error(error)
    }
  });
  const handleClean = () => {
    setBlends({ b1: "", b2: "", b3: "" })
  };
  const handleSubmit = useCallback(async () => {
    try {
      const id = Math.floor(Math.random() * Date.now()) % 4294967296;
      const option = sha3_256(blends.b1 + blends.b2 + blends.b3).slice(0, 10);
      const blend = concat([toBytesString(option), toBytesString(accountHash)]);
      const hash = blake.blake2b(blend, null, 32)
      const hash_hex = toHexString(hash);
      const contractPackageHash = decodeBase16(contractHash);
      const publicKey = CLPublicKey.fromHex(activePublicKey);
      const deployParams = new DeployUtil.DeployParams(publicKey, env);
      let args = RuntimeArgs.fromMap({
        new_move_id: new CLU32(id),
        owner_blend_hash: new CLString(hash_hex),
      });
      const session = DeployUtil.ExecutableDeployItem.newStoredContractByHash(
        contractPackageHash,
        "new_move",
        args
      )
      const deployUnsigned = DeployUtil.makeDeploy(
        deployParams,
        session,
        DeployUtil.standardPayment(7000000000)
      );
      const deployJson = DeployUtil.deployToJson(deployUnsigned);
      let signedDeployJSON = await Signer.sign(deployJson, activePublicKey, activePublicKey);
      let signedDeploy = DeployUtil.deployFromJson(signedDeployJSON).unwrap();
      showTransaction();
      let resultDeploy = await clientRpc.deploy(signedDeploy);
      let result = await checkStatusDeploy(resultDeploy.deploy_hash);
      appState.executionResults.loading = false;
      checkResultDeploy(result, 'new_move')

    } catch (error) {
      console.log(error)
      console.error(error)
    }
  });

  useEffect(() => {
    filterUnplayedMoves()
  }, [])

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
      
      {/* <Box direction='row' align='center' gap='small'>
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
      </Box> */}
      <Box direction='row' alignSelf='end' gap='medium' pad={{ right: 'large' }}>
        <Button
          onClick={handleClean}
          label="clear"
          disabled={isLogged ? false : true}
        />
        <Button
          onClick={handleSubmit}
          label="submit"
          disabled={isLogged && blends.b1 !== '' && blends.b2 !== '' && blends.b3 !== '' ? false : true}
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
      <Box direction='row' gap='medium' align='center'>
        <Text>unplayed moves</Text>
        <Refresh size='small' onClick={() => filterUnplayedMoves()} />
      </Box>
      <Box gap='medium' direction={size === 'small' ? 'column' : 'row'} align='center'>
        <Text size='small'>id</Text>
        <Text size='small'>owner</Text>
        <Text size='small'>play</Text>
      </Box>
      {
        appState.unplayedMoves.length > 0 && isLogged ?
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
                  accountHash={accountHash}
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
                  <Text size='small'>{`${item.ownerAccountHash.substring(0, 6)}...${item.ownerAccountHash.substring(item.ownerAccountHash.length - 6)}`}</Text>
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
          onClickOutside={hidePlay}
          onEsc={hidePlay}
        >
          <Box gap='medium' align='center' pad='medium'>
            <Close onClick={hidePlay} size='small' />
            <Play
              playTarget={playTarget}
              accountHash={accountHash}
              activePublicKey={activePublicKey}
              size={size}
              contractHash={contractHash}
              env={env}
              filterMoveForId={filterMoveForId}
              showTransaction={showTransaction}
              clientRpc={clientRpc}
              checkStatusDeploy={checkStatusDeploy}
              checkResultDeploy={checkResultDeploy}
              hidePlay={hidePlay}
            />
          </Box>
        </Layer>
      )
    }
    {
      openTransaction && (
        <Layer
          position="center"
          margin="medium"
          responsive
          modal
          full="vertical"
          onClickOutside={hideTransaction}
          onEsc={hideTransaction}
        >
          <Box gap='medium' align='center' pad='small' width={{ min: 'medium' }} justify='center' flex>
            <Box align='center' gap='small' margin={{bottom: 'medium'}}>
              <Close onClick={hideTransaction} size='small' />
              <Text weight='bold'>Transaction Result</Text>
            </Box>
            {
              executionResults.loading ?
                <Box gap='small' align='center'>
                  <Text size='small'>Please wait... it may take a few minutes</Text>
                  <Spinner size='medium' />
                </Box>
                :
                <Box gap='medium' align='center' >
                  <Box gap='small' align='center'>
                    <Text size='small'>{executionResults.statusMessage}</Text>
                    <Text size='small'>{executionResults.message}</Text>

                    <Box direction='row' gap='xsmall'>
                      <Text size='small'>Deploy hash:</Text>
                      <Anchor
                        size='small'
                        href={`${explorerUrl}/deploy/${lastDeployHash}`}
                        target='_blank'
                        label={`${lastDeployHash.substring(0, 6)}...${lastDeployHash.substring(lastDeployHash.length - 6)}`}
                      />
                    </Box>
                  </Box>
                  {
                    executionResults.method == 'play_move' &&
                    executionResults.status == 'success' &&

                    (
                      <Box gap='small' pad='small' align='center' border>
                        <Text weight='bold'>{movePlayed.message}</Text>
                        <Text size='small'>winner: {movePlayed.winner ? `${movePlayed.winner.substring(0, 6)}...${movePlayed.winner.substring(movePlayed.winner.length - 6)}` : 'no winner'}</Text>
                        <Text size='small'>id: {`${movePlayed.id}`}</Text>
                        <Text size='small'>blendWinner: {movePlayed.blendWinner ? `${movePlayed.blendWinner.substring(0, 6)}...${movePlayed.blendWinner.substring(movePlayed.blendWinner.length - 6)}` : 'no winner'}</Text>
                      </Box>
                    )
                  }
                </Box>
            }
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
        { label: <Avatar src={'/gawibawibo-casper/rock-icon-grey.png'} size='small' />, value: optionsValues[0] },
        { label: <Avatar src={'/gawibawibo-casper/paper-icon-grey.png'} size='small' />, value: optionsValues[1] },
        { label: <Avatar src={'/gawibawibo-casper/scissors-icon-grey.png'} size='small' />, value: optionsValues[2] },
      ]}
      value={blends.b1}
      onChange={(e) => setBlends({ ...blends, b1: e.target.value })}
      direction='row'
      disabled={isLogged ? false : true}
    />
    <RadioButtonGroup
      name='blend2'
      options={[
        { label: <Avatar src={'/gawibawibo-casper/rock-icon-grey.png'} size='small' />, value: optionsValues[0] },
        { label: <Avatar src={'/gawibawibo-casper/paper-icon-grey.png'} size='small' />, value: optionsValues[1] },
        { label: <Avatar src={'/gawibawibo-casper/scissors-icon-grey.png'} size='small' />, value: optionsValues[2] },
      ]}
      value={blends.b2}
      onChange={(e) => setBlends({ ...blends, b2: e.target.value })}
      direction='row'
      disabled={isLogged ? false : true}
    />
    <RadioButtonGroup
      name='blend3'
      options={[
        { label: <Avatar src={'/gawibawibo-casper/rock-icon-grey.png'} size='small' />, value: optionsValues[0] },
        { label: <Avatar src={'/gawibawibo-casper/paper-icon-grey.png'} size='small' />, value: optionsValues[1] },
        { label: <Avatar src={'/gawibawibo-casper/scissors-icon-grey.png'} size='small' />, value: optionsValues[2] },
      ]}
      value={blends.b3}
      onChange={(e) => setBlends({ ...blends, b3: e.target.value })}
      direction='row'
      disabled={isLogged ? false : true}
    />
  </Box>
}

const ActionButton = ({ move, accountHash, handleCancel, handlePlay }) => {

  if (move.ownerAccountHash === accountHash) {
    return <Button label='cancel' size='small' onClick={() => handleCancel(move.id)} />
  } else {
    return <Button label='play' size='small' onClick={() => handlePlay(parseInt(move.id))} />
  }

}

export default Main;
