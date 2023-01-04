import React from 'react';
import { useNavigate, Link as ReactLink } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import {
  Flex, Box, Text, Stack, Link, Image, Avatar, Menu, MenuButton, MenuList, MenuItem, Button, HStack,
  Circle, Icon, Popover, PopoverTrigger, PopoverContent, PopoverBody,
} from '@chakra-ui/react';
import { BellIcon } from '@chakra-ui/icons';
import Logo from '../public/Pay_Collected_Logo.png';
import { EditPayment as EDIT_PAYMENT, DeleteNotification as DELETE_NOTI } from '../graphql/mutations.gql';
import { RetrieveNotifications as GET_NOTIFICATIONS } from '../graphql/queries.gql';
import UnauthenticatedNavBar from './UnauthenticatedNavBar.jsx';

function CircleIcon(props) {
  return (
    <Icon viewBox="0 0 200 200" {...props}>
      <path
        fill="currentColor"
        d="M 100, 100 m -75, 0 a 75,75 0 1,0 150,0 a 75,75 0 1,0 -150,0"
      />
    </Icon>
  );
};

export default function NavBar({
  user, setUser, setPlanToJoin, setPlanToView
}) {
  const navigate = useNavigate();

  const logUserOut = () => {
    localStorage.clear();
    setUser(null);
    setPlanToJoin(null);
    setPlanToView(null);
    navigate('/');
  };

  const { data } = useQuery(GET_NOTIFICATIONS, {
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-only',
  });

  const [deleteNoti, { loading }] = useMutation(DELETE_NOTI, {
    update: (cache, { data: { deleteNotification: id } }) => {
      cache.modify({
        fields: {
          retrieveNotifications(obj) {
            const { count, notifications } = obj;
            return { count, notifications: notifications.filter((noti) => noti.__ref !== `Notification:${id}`) };
          },
        }
      });
    },
    onError: ({ message }) => { console.log(message); },
  });

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

  if (!user) {
    return (<UnauthenticatedNavBar />);
  }

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
          <Button type="button" onClick={submitEditPayment} variant="navBarBtn">Payments</Button>
          <Link href="/">
            <Text display="block">
              Statements
            </Text>
          </Link>
        </Stack>
      </Box>
      <Box>
        <HStack spacing={6}>
          {data && data.retrieveNotifications.count > 0 && (
            <Box>
              <Popover isLazy>
                <PopoverTrigger>
                  <Circle size="50px" bg="gray.400" position="relative" as="button">
                    <CircleIcon color="red.500" position="absolute" top={-1.75} right={-1.75} boxSize={5} />
                    <BellIcon boxSize={6} color="white" />
                  </Circle>
                </PopoverTrigger>
                <PopoverContent right={6}>
                  Im the popover
                </PopoverContent>
              </Popover>
            </Box>
          )}
          {(!data || (data && data.retrieveNotifications.count === 0)) && (
            <Circle size="50px" bg="gray.400" as="button">
              <BellIcon boxSize={6} color="white" />
            </Circle>
          )}
          <Menu>
            <MenuButton>
              {/* TO-DO: Add Avatar Icon */}
              <Avatar src="insert-url" />
            </MenuButton>
            <MenuList>
              <MenuItem onClick={() => navigate('/manage-account')}>Profile</MenuItem>
              <MenuItem onClick={() => logUserOut()}>Log Out</MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Box>
    </Flex>
  );
}
