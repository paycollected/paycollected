import React, { useState } from 'react';
import { useNavigate, Link as ReactLink } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import {
  Flex, Box, Text, Stack, Link, Button, Image, Avatar, Menu, MenuButton, MenuList, MenuItem
} from '@chakra-ui/react';
import { CloseIcon, HamburgerIcon } from '@chakra-ui/icons';
import Logo from '../public/Pay_Collected_Logo.png';
import { EditPayment as EDIT_PAYMENT } from '../graphql/mutations.gql';
import { NavBarBtn } from '../styles/styles.js';

export default function NavBar({ user, setUser, setPlanToJoin }) {
  const navigate = useNavigate();
  const [toggleMenu, setToggleMenu] = useState(false);

  const logUserOut = () => {
    localStorage.clear();
    setUser(null);
    setPlanToJoin(null);
    navigate('/');
  };

  const [
    submitEditPayment,
    { loading: editPaymentLoading, error: editPaymentError, data: editPaymentData }
  ] = useMutation(EDIT_PAYMENT, {
    onCompleted: ({ editPayment }) => {
      const { portalSessionURL } = editPayment;
      window.location.replace(portalSessionURL);
    },
    onError: ({ message }) => { console.log(message); }
  });

  return (
    <Flex
      align="center"
      justify="space-between"
      wrap="wrap"
      w="100%"
      mb={8}
      p={8}
      bg={['white']}
      color={['gray.600']}
      borderBottomWidth="1px"
      borderColor="gray.200"
    >
      <Box display="flex">
        <Link as={ReactLink} to="/">
          <Image
            src={Logo}
            alt="Pay Collected Logo"
            fit="cover"
            htmlWidth="200px"
            loading="eager"
          />
        </Link>
        {user
          && (
            <Stack
              spacing={8}
              align="center"
              justify="flex-end"
              direction="row"
              pt="0"
              pl="4"
            >
              <Link as={ReactLink} to="/dashboard">
                <Text display="block">
                  Dashboard
                </Text>
              </Link>
              <NavBarBtn type="button" onClick={submitEditPayment}>Payments</NavBarBtn>
              <Link href="/">
                <Text display="block">
                  Statements
                </Text>
              </Link>
            </Stack>
          )}
      </Box>
      <Box>
        {user ? (
          <Menu>
            <MenuButton>
              {/* TO-DO: Add Avatar Icon */}
              <Avatar src="insert-url" />
            </MenuButton>
            <MenuList>
              {/* TO-DO: Link to Edit Profile page */}
              <MenuItem>Profile</MenuItem>
              <MenuItem onClick={() => logUserOut()}>Log Out</MenuItem>
            </MenuList>
          </Menu>
        ) : (
          <Box
            display={{ base: 'block', md: 'none' }}
            onClick={() => setToggleMenu(!toggleMenu)}
          >
            {toggleMenu ? <CloseIcon /> : <HamburgerIcon />}
          </Box>
        )}
      </Box>
      {!user
        && (
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
        )}
    </Flex>
  );
}
