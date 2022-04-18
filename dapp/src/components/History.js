import { Box, List, Text, ResponsiveContext} from 'grommet';
import React, { useContext, useEffect } from 'react';
import { useSnapshot } from 'valtio';
import { appState, useCasper } from '../App';

export const History = () => {
  const { currentAccountMoves } = useSnapshot(appState);
  const { filterCurrentAccountMoves } = useCasper();
  const size = useContext(ResponsiveContext);

  useEffect(() => {
    filterCurrentAccountMoves()
  }, [])
  
  
  return <Box background='c1' align='center' pad='medium' gap='medium' border={{ color: 'c2' }} fill>
    <Text>my played moves</Text>
    <Box gap={size === 'small' ? 'small' : 'medium'} direction={ size === 'small' ? 'column' : 'row'} pad={{horizontal: 'medium'}} align='center' justify='around' fill='horizontal'>
      <Text size='small'>id</Text>
      <Text size='small'>owner</Text>
      <Text size='small'>adversary</Text>
      <Text size='small'>winner</Text>
      <Text size='small'>status</Text>
    </Box>
    <List data={currentAccountMoves} primaryKey='id' paginate={{ size: 'small' }} step={size === 'small' ? 2 : 5}>
      {(item) => (
        <Box gap='small' direction={size === 'small' ? 'column' : 'row'} pad={{ horizontal: 'small' }} align='center' justify='around' fill='horizontal'>
          <Text size='small'>{item.id}</Text>
          <Text size='small'>{`${item.ownerAccountHash.substring(0, 6)}...${item.ownerAccountHash.substring(item.ownerAccountHash.length - 6)}`}</Text>
          <Text size='small'>{item.adversaryAccountHash ? `${item.adversaryAccountHash.substring(0, 6)}...${item.adversaryAccountHash.substring(item.adversaryAccountHash.length - 6)}` : 'no adversary'}</Text>
          <Text size='small'>{item.winner ? `${item.winner.substring(0, 6)}...${item.winner.substring(item.winner.length - 6)}` : 'no winners'}</Text>
          <Text size='small'>{item.status}</Text>
        </Box>
      )}
    </List>
  </Box>;
};

export default History;
