import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import {
  Button, FormControl, FormLabel, Input, Heading, VStack, WrapItem, Wrap, useDisclosure, Alert,
  AlertIcon, AlertDescription, CloseButton, Box, HStack, Flex,
} from '@chakra-ui/react';
import { ViewAllPlans as GET_ALL_PLANS } from '../../graphql/queries.gql';
import NavBar from '../../components/NavBar.jsx';
import PlansTableLayout from './PlansTableLayout.jsx';
import CreatePlanDrawer from './createPlan/CreatePlanDrawer.jsx';

const queryStr = window.location.search;
let username;
let token;
if (queryStr.length > 0) {
  const urlParams = new URLSearchParams(queryStr);
  username = urlParams.get('username');
  token = urlParams.get('token');
}

export default function Dashboard({
  user, setUser, setPlanToJoin, setPlanToView, successPlan, setSuccessPlan,
}) {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const {
    isOpen: isOpenCreatePlan, onOpen: onOpenCreatePlan, onClose: onCloseCreatePlan
  } = useDisclosure();
  const {
    isOpen: successIsOpen, onClose: successOnClose,
  } = useDisclosure({ defaultIsOpen: !!successPlan });

  useEffect(() => {
    if (user === null && !!username && !!token) {
      setUser(username);
      localStorage.setItem('token', token);
    } else if (user === null) {
      navigate('/');
    }
  }, []);

  const {
    loading, data, error, fetchMore, refetch, networkStatus,
  } = useQuery(GET_ALL_PLANS, {
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-only',
    variables: { orderBy: 'PLAN_NAME', offset: 0, filterByOwnership: false },
    notifyOnNetworkStatusChange: true,
  });

  const [tabIndex, setTabIndex] = useState(0);
  const [sortBy, setSortBy] = useState('PLAN_NAME');


  const codeInputSubmit = (e) => {
    e.preventDefault();
    const formattedCode = code.trim();
    setCode(formattedCode);
    navigate(`/join/${formattedCode}`);
  };

  if (data) {
    return (
      <>
        <NavBar
          user={user}
          setUser={setUser}
          setPlanToJoin={setPlanToJoin}
          setPlanToView={setPlanToView}
          setSuccessPlan={setSuccessPlan}
        />
        <VStack w="93%" justify="left" spacing={{ base: '6', md: '10' }} mb="10">
          {successPlan && successIsOpen && (
            <Box w="100%">
              <Alert w={{ base: '95%', md: '65%' }} status="info" borderRadius={10}>
                <Flex w="100%" justify="space-between">
                  <HStack spacing={0}>
                    <AlertIcon />
                    <Box>
                      <AlertDescription>
                        {`${successPlan} has been added to your Dashboard.`}
                      </AlertDescription>
                    </Box>
                  </HStack>
                  <CloseButton
                    alignSelf="flex-start"
                    position="relative"
                    right={-1}
                    top={-1}
                    onClick={successOnClose}
                  />
                </Flex>
              </Alert>
            </Box>
          )}
          <Wrap w="100%" spacingX={{ base: '4', md: '8' }} align="end">
            <WrapItem>
              <Heading as="h1" fontSize="3xl">Your Plans</Heading>
            </WrapItem>
            <WrapItem>
              <Button onClick={onOpenCreatePlan}>Create Plan</Button>
            </WrapItem>
          </Wrap>
          <PlansTableLayout
            total={data.viewAllPlans.total}
            plans={data.viewAllPlans.plans}
            setPlanToView={setPlanToView}
            setPlanToJoin={setPlanToJoin}
            successPlan={successPlan}
            setSuccessPlan={setSuccessPlan}
            fetchMore={fetchMore}
            refetch={refetch}
            tabIndex={tabIndex}
            setTabIndex={setTabIndex}
            networkStatus={networkStatus}
            sortBy={sortBy}
            setSortBy={setSortBy}
          />
          <Wrap w="100%" align="end" spacingX={{ base: '4', md: '8' }}>
            <WrapItem>
              <FormControl
                isRequired
                w="max-content"
              >
                <FormLabel textStyle="note">Received a plan code?</FormLabel>
                <Input
                  type="text"
                  w="250px"
                  bg="white"
                  placeholder="Enter Code"
                  value={code}
                  onChange={(e) => { setCode(e.target.value); }}
                  _focusVisible={{ boxShadow: 'none', zIndex: 1, borderColor: '#3182CE' }}
                />
              </FormControl>
            </WrapItem>
            <WrapItem>
              <Button type="button" variant="outline" onClick={codeInputSubmit}>Join Plan</Button>
            </WrapItem>
          </Wrap>
        </VStack>
        <CreatePlanDrawer
          isOpen={isOpenCreatePlan}
          onClose={onCloseCreatePlan}
          setPlanToJoin={setPlanToJoin}
        />
      </>
    );
  }
  return null;
}
