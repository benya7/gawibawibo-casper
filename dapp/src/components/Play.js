import { Box, Button, Text, TextInput } from 'grommet';
import React, { useState , useCallback} from 'react';
import { Options } from './Main'
import blake from 'blakejs';
import { toHexString, toBytesString, sleepTime } from '../utils';
import { sha3_256 } from 'js-sha3';
import { CLPublicKey, decodeBase16, DeployUtil, RuntimeArgs, CLString, CLU32 } from 'casper-js-sdk';
import { concat } from '@ethersproject/bytes';
import { appState } from '../App';

export const Play = ({ 
  playTarget, 
  accountHash, 
  activePublicKey, 
  size, 
  contractHash, 
  env, 
  filterMoveForId, 
  showTransaction, 
  clientRpc, 
  checkStatusDeploy, 
  checkResultDeploy,
  wallet,
  hidePlay
}) => {
  const [blends, setBlends] = useState({ b1: "", b2: "", b3: "" });

  const handleClean = () => {
    setBlends({ b1: "", b2: "", b3: "" })
  };

  const handleSubmit = useCallback(async () => {
    try {
      const option = sha3_256(blends.b1 + blends.b2 + blends.b3).slice(0, 10);
      const blend = concat([toBytesString(option), toBytesString(accountHash)]);
      const hash = blake.blake2b(blend, null, 32)
      const hash_hex = toHexString(hash);
      const contractPackageHash = decodeBase16(contractHash);
      const publicKey = CLPublicKey.fromHex(activePublicKey);
      const deployParams = new DeployUtil.DeployParams(publicKey, env);
      let args = RuntimeArgs.fromMap({
        target_move_id: new CLU32(playTarget),
        adversary_blend_hash: new CLString(hash_hex),
      });
      const session = DeployUtil.ExecutableDeployItem.newStoredContractByHash(
        contractPackageHash,
        "play_move",
        args
      )
      const deployUnsigned = DeployUtil.makeDeploy(
        deployParams,
        session,
        DeployUtil.standardPayment(7000000000)
      );
      const deployJson = DeployUtil.deployToJson(deployUnsigned);
      hidePlay();
      let signedDeployJSON = await wallet.sign(deployJson, activePublicKey, activePublicKey);
      let signedDeploy = DeployUtil.deployFromJson(signedDeployJSON).unwrap();
      showTransaction();
      let resultDeploy = await clientRpc.deploy(signedDeploy);
      let result = await checkStatusDeploy(resultDeploy.deploy_hash);
      checkResultDeploy(result, 'play_move')
      appState.movePlayed.message = '';
      appState.movePlayed.blendWinner = '';
      appState.movePlayed.id = '';



      await sleepTime(20000)
      let move = await filterMoveForId(playTarget)
      if (move.winner === accountHash) {
        appState.movePlayed.message = 'Congratulations, you win this move!'
        appState.movePlayed.blendWinner = move.ownerBlendHash;
        appState.movePlayed.winner = move.winner;

      } else if (move.winner === undefined) {
        appState.movePlayed.message = 'The game was tied'
        appState.movePlayed.blendWinner = undefined;
        appState.movePlayed.winner = undefined;

      } else {
        appState.movePlayed.message = 'You lost the game, try again!'
        appState.movePlayed.blendWinner = move.adversaryBlendHash;
        appState.movePlayed.winner = move.winner;
      }
      appState.movePlayed.id = move.id;

      appState.executionResults.loading = false;
    } catch (error) {
      console.log(error)
      console.error(error)
    }
  });
  
  return <Box
    background='c1'
    align='center'
    height={{ min: '450px', max: '450px' }}
    pad={size === 'small' ? 'large' : 'medium'}
    gap={size === 'small' ? 'large' : 'medium'}
    border={{ color: 'c2' }}
    fill
  >
    <Text>Make a new move!</Text>
    <Text>Chooise a blend:</Text>
    <Options blends={blends} setBlends={setBlends} isLogged={true} />
    <Box direction='row' alignSelf='end' gap='medium' pad={{ right: 'large' }}>
      <Button onClick={handleClean} label="clear" />
      <Button
        onClick={handleSubmit}
        disabled={blends.b1 !== '' && blends.b2 !== '' && blends.b3 !== '' ? false : true}
        label="submit"
      />
    </Box>
  </Box>;
};

export default Play;
