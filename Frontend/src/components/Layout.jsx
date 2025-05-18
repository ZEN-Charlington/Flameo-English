import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <Box minH="100vh">
      <Navbar />
      <Box 
        as="main" 
        pt="74px" 
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;