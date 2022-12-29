import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import {
  Flex, Box, Heading, Button, VStack, Card, CardHeader, CardBody, Text,
} from '@chakra-ui/react';
import NavBar from '../../components/NavBar.jsx';
import JoinPlanGrid from './JoinPlanGrid.jsx';
import { PreJoinPlan as GET_PLAN } from '../../graphql/queries.gql';

export default function JoinPlan({
  setPlanToJoin, setStripeClientSecret, setSetupIntentId, setPaymentMethods, user, setUser,
  setPlanToView,
}) {
  const navigate = useNavigate();

  useEffect(() => {
    const planId = window.location.pathname.split('/')[2];
    if (!/^prod_(?:[a-zA-Z0-9]){14}$/.test(planId)) {
      navigate('/404');
    }
  }, []);

  const { planId } = useParams();

  const { loading, data, error } = useQuery(GET_PLAN, {
    variables: { planId: planId.toString().trim() },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-only',
  });

  useEffect(() => {
    if (planId) setPlanToJoin(planId.toString().trim());
  }, []);

  if (error) {
    const { message } = error;
    if (message === 'No plan matched search') {
      return message; // consider how UI should handle this
    }
  }

  if (data) {
    const {
      viewOnePlan: {
        planId: planIdFromQuery, name, cycleFrequency, perCycleCost, startDate, owner, isOwner,
        activeMembers, quantity: currQuant, totalQuantity,
      }
    } = data;

    return (
      <>
        <NavBar
          user={user}
          setUser={setUser}
          setPlanToJoin={setPlanToJoin}
          setPlanToView={setPlanToView}
        />
        <VStack w="93%" justify="left" spacing={{ base: 6, md: 10 }} mb={{ base: 6, md: 10 }}>
          <Flex w="100%" align="center">
            <Button
              type="button"
              variant="navActionBtn"
              onClick={() => {
                setPlanToView(null);
                navigate('/dashboard');
              }}
              h="max-content"
            >
              Back to Dashboard
            </Button>
          </Flex>
          <Box w="100%">
            <VStack w={{ base: '95%', md: '80%' }} mb={10} spacing={4}>
              <Flex w="100%" id="flex" direction="column" justify="start">
                <Heading as="h1" variant="accented" pb={0}>Join plan</Heading>
              </Flex>
              <Flex w="100%" direction="column" justify="start">
                <Text w={{ base: '100%', md: '75%' }} lineHeight="taller">
                  {`Confirm the number of subscriptions you would like to pay for and continue to payment to join plan.`}
                </Text>
              </Flex>
            </VStack>
            <Card w={{ base: '95%', md: '80%' }}>
              <CardHeader mx={6} mt={8} pb={4}>
                <Heading as="h2" variant="nuanced" color="#272088">{name}</Heading>
              </CardHeader>
              <CardBody mx={6} mb={8} mt={0}>
                <Box w={{ base: '100%', md: '70%' }}>
                  <JoinPlanGrid
                    name={name}
                    isOwner={isOwner}
                    owner={owner}
                    cycleFrequency={cycleFrequency}
                    perCycleCost={perCycleCost}
                    startDate={startDate}
                    members={activeMembers}
                    currQuant={currQuant}
                    totalQuantity={totalQuantity}
                    planId={planIdFromQuery}
                    setStripeClientSecret={setStripeClientSecret}
                    setSetupIntentId={setSetupIntentId}
                    setPaymentMethods={setPaymentMethods}
                  />
                </Box>
              </CardBody>
            </Card>
          </Box>
        </VStack>
      </>
    );
  }
  return null;
}
