import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import {
  Flex, Box, Heading, Button, VStack, Card, CardHeader, CardBody, CardFooter, Text, Grid, GridItem,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import NavBar from '../../components/NavBar.jsx';
import JoinPlanGrid from './JoinPlanGrid.jsx';
import { PreJoinPlan as GET_PLAN } from '../../graphql/queries.gql';
import { JoinPlan as JOIN_PLAN } from '../../graphql/mutations.gql';

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

  // will need to handle this payLoading state on client side so user knows what to expect
  const [makePayment, { loading: joinPlanLoading, error: joinPlanError }] = useMutation(
    JOIN_PLAN,
    {
      onCompleted: ({ joinPlan: { clientSecret, setupIntentId, paymentMethods } }) => {
        setStripeClientSecret(clientSecret);
        setSetupIntentId(setupIntentId);
        setPaymentMethods(paymentMethods);
        navigate('/checkout');
      },
      onError: ({ message }) => { console.log(message); },
    }
  );

  const {
    handleSubmit, watch, formState: { errors }, control,
  } = useForm({ defaultValues: { quantity: 1 } });
  const watchQuantityInput = watch('quantity');

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
        planId: planIdFromQuery, name, cycleFrequency, perCycleCost, nextBillDate, owner, isOwner,
        activeMembers, quantity: currQuant, totalQuantity,
      }
    } = data;

    const onSubmit = ({ quantity }) => {
      makePayment({ variables: { planId: planIdFromQuery, quantity } });
    };

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
              <form onSubmit={handleSubmit(onSubmit)}>
                <CardBody mx={6} mb={0} mt={0} w={{ base: '100%', md: '70%' }}>
                  <JoinPlanGrid
                    name={name}
                    isOwner={isOwner}
                    owner={owner}
                    cycleFrequency={cycleFrequency}
                    perCycleCost={perCycleCost}
                    nextBillDate={nextBillDate}
                    members={activeMembers}
                    currQuant={currQuant}
                    totalQuantity={totalQuantity}
                    errors={errors}
                    watchQuantityInput={watchQuantityInput}
                    control={control}
                  />
                </CardBody>
                <CardFooter mx={6} mb={8} pt={4} w={{ base: '100%', md: '70%' }}>
                  <Grid
                    w="100%"
                    templateRows={{ base: 'repeat(2, max-content)', md: 'max-content' }}
                    templateColumns={{ base: '70%', md: 'repeat(2, 1fr)' }}
                    gap={{ base: 4, md: 0 }}
                  >
                    <GridItem w="90%">
                      <Button w="100%" type="button" variant="outline">Cancel</Button>
                    </GridItem>
                    <GridItem w="90%">
                      <Button w="100%" type="submit">Continue to payment</Button>
                    </GridItem>
                  </Grid>
                </CardFooter>
              </form>
            </Card>
          </Box>
        </VStack>
      </>
    );
  }
  return null;
}
