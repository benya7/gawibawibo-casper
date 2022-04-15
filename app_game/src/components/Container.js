import { Box } from 'grommet';
import React from 'react';


const Container = ({ size, children}) => {
  return <Box pad={{ horizontal: size}}>
    {children}
  </Box>;
};

export default Container;
