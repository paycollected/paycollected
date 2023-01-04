import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import {
  Button, FormControl, FormLabel, Input, Heading, VStack, WrapItem, Wrap, useDisclosure
} from '@chakra-ui/react';
import {
  ViewAllPlans as GET_ALL_PLANS,
} from '../../graphql/queries.gql';
import NavBar from '../../components/NavBar.jsx';
import PlansTableLayout from './PlansTableLayout.jsx';
import CreatePlanDrawer from './createPlan/CreatePlanDrawer.jsx';

// actual redirect URL string 'http://localhost:5647/dashboard/?setup_intent=seti_1Lq9rqAJ5Ik974ueIdg7WHn9&setup_intent_client_secret=seti_1Lq9rqAJ5Ik974ueIdg7WHn9_secret_MZISJyXsMF6na4pA6ryaqOfvt8JbeGa&redirect_status=succeeded'
const queryStr = window.location.search;
let username;
let token;
if (queryStr.length > 0) {
  const urlParams = new URLSearchParams(queryStr);
  username = urlParams.get('username');
  token = urlParams.get('token');
}

export default function Dashboard({
  user, setUser, setPlanToJoin, setPlanToView
}) {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const {
    isOpen: isOpenCreatePlan, onOpen: onOpenCreatePlan, onClose: onCloseCreatePlan
  } = useDisclosure();

  useEffect(() => {
    if (user === null && !!username && !!token) {
      setUser(username);
      localStorage.setItem('token', token);
    } else if (user === null) {
      navigate('/');
    }
  }, []);

  const { loading, data, error } = useQuery(GET_ALL_PLANS, {
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-only',
  });

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
        />
        <VStack w="93%" justify="left" spacing={{ base: '6', md: '10' }} mb="10">
          <Wrap w="100%" spacingX={{ base: '4', md: '8' }} align="end">
            <WrapItem>
              <Heading as="h1" fontSize="3xl">
                {`${data.viewAllPlans.total} Active Plans`}
              </Heading>
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
