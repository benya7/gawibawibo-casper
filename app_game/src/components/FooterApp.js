import React from 'react'
import { Footer, Box, Text, Anchor } from 'grommet';

const FooterApp = () => {
  return (
    <Footer pad="small">
      <Box align="center" direction="row" gap="xsmall">
        <Text alignSelf="center" size="small">
          GawiBawiBo v1.0
        </Text>
      </Box>
      <Anchor size='xsmall' href="https://github.com/en0c-026" target='_blank' label="by en0c-026" />
      <Text textAlign="center" size="xsmall">
        ©Copyright 2022
      </Text>
    </Footer>
  )
}

export default FooterApp