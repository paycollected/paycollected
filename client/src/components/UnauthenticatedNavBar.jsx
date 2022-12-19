import React, { useState } from 'react';
import { useNavigate, Link as ReactLink } from 'react-router-dom';
import {
  Flex, Box, Text, Stack, Link, Button, Image,
} from '@chakra-ui/react';
import { CloseIcon, HamburgerIcon } from '@chakra-ui/icons';
import Logo from '../public/Pay_Collected_Logo.png';

export default function UnauthenticatedNavBar() {
  const navigate = useNavigate();
  const [toggleMenu, setToggleMenu] = useState(false);

  return (
    <Flex
      align="center"
      justify="space-between"
      wrap="wrap"
      w="100%"
      mb={8}
      p={4}
      bg={['white']}
      color={['gray.600']}
      borderBottomWidth="1px"
      borderColor="gray.200"
    >
      <Box display="flex">
        <Link as={ReactLink} to="/">
          <Box w={[180, 300]}>
            <Image
              src={Logo}
              alt="PayCollected Logo"
              fit="cover"
              loading="eager"
            />
          </Box>
        </Link>
      </Box>
      <Box>
        <Box
          display={{ base: 'block', md: 'none' }}
          onClick={() => setToggleMenu(!toggleMenu)}
        >
          {toggleMenu ? <CloseIcon /> : <HamburgerIcon />}
        </Box>
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
          pl="4"
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
          <Button onClick={() => { navigate('/login'); }}>
            Login
          </Button>
        </Stack>
      </Box>
    </Flex>
  );
}
