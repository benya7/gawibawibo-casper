import { Box, List, Text, ResponsiveContext} from 'grommet';
import React, { useContext } from 'react';
import { useSnapshot } from 'valtio';
import { appState } from '../App';
import { utils } from 'near-api-js';

export const History = () => {
  const { historyMoves } = useSnapshot(appState);
  const size = useContext(ResponsiveContext);
  
  return <Box background='c1' align='center' pad='medium' gap='medium' border={{ color: 'c2' }} fill>
    <Text>my played moves</Text>
    <Box gap={size === 'small' ? 'small' : 'medium'} direction={ size === 'small' ? 'column' : 'row'} align='center'>
      <Text size='small'>id</Text>
      <Text size='small'>owner</Text>
      <Text size='small'>adversary</Text>
      <Text size='small'>prize</Text>
      <Text size='small'>winner</Text>
      <Text size='small'>status</Text>
    </Box>
    <List data={historyMoves} primaryKey='id' paginate={{ size: 'small' }} step={size === 'small' ? 2 : 5}>
      {(item) => (
        <Box gap='small' direction={ size === 'small' ? 'column' : 'row'} align='center' justify='between'>
          <Text size='small'>{item.id}</Text>
          <Text size='small'>{item.owner}</Text>
          <Text size='small'>{item.adversary}</Text>
          <Text size='small'>{utils.format.formatNearAmount(item.prize)} NEAR</Text>
          <Text size='small'>{item.winner}</Text>
          <Text size='small'>{item.status}</Text>
        </Box>
      )}
    </List>
  </Box>;
};

export default History;
