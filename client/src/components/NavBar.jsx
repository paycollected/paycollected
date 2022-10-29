import React, { useState } from 'react';
import { useNavigate, Link as ReactLink } from 'react-router-dom';
import {
  Flex, Box, Text, Stack, StackDivider, Link, Button,
} from '@chakra-ui/react';
import { CloseIcon, HamburgerIcon } from '@chakra-ui/icons';

export default function NavBar({ user, setUser, setPlanToJoin }) {
  const navigate = useNavigate();
  const [toggleMenu, setToggleMenu] = useState(false);

  const logUserOut = () => {
    localStorage.clear();
    setUser(null);
    setPlanToJoin(null);
    navigate('/');
  };

  return (
    <Flex
      align="center"
      justify="space-between"
      wrap="wrap"
      w="100%"
      mb={8}
      p={8}
      bg={['blue.600']}
      color={['white']}
    >
      <Box>
        <Text fontSize="lg" fontWeight="bold">
          Logo
        </Text>
      </Box>
      <Box display={{ base: 'block', md: 'none' }} onClick={() => setToggleMenu(!toggleMenu)}>
        {toggleMenu ? <CloseIcon /> : <HamburgerIcon />}
      </Box>
      <Box
        display={{ base: toggleMenu ? 'block' : 'none', md: 'block' }}
        flexBasis={{ base: '100%', md: 'auto' }}
      >
        <Stack
          spacing={8}
          align="center"
          justify={['center', 'space-between', 'flex-end', 'flex-end']}
          direction={['column', 'row', 'row', 'row']}
          pt={[4, 4, 0, 0]}
          divider={<StackDivider borderColor="gray.200" />}
        >
          <Link href="/">
            <Text display="block">
              How to use
            </Text>
          </Link>
          <Link href="/">
            <Text display="block">
              FAQs
            </Text>
          </Link>
          {user ? (
            <Link as={ReactLink} to="/dashboard">
              <Text display="block">
                Dashboard
              </Text>
            </Link>
          ) : (
            <Button onClick={() => { navigate('/login'); }}>
              Login
            </Button>
          )}
          {user ? (
            <Button onClick={logUserOut}>
              Log Out
            </Button>
          ) : (
            <Button onClick={() => { navigate('/signup'); }}>
              Sign Up
            </Button>
          )}
        </Stack>
      </Box>
    </Flex>
  );
}
