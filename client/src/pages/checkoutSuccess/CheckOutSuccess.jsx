import React, { useEffect } from 'react';
import {
  Flex, Card, CardHeader, CardBody, CardFooter, Heading, VStack, Text, Button, Grid, GridItem,
  Container,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import NavBar from '../../components/NavBar.jsx';
import { SuccessfulPaymentData as SUBS_INFO } from '../../graphql/queries.gql';

// test link: http://localhost:5647/checkout-success/?setup_intent=seti_1Lq9rqAJ5Ik974ueIdg7WHn9

const queryStr = window.location.search;
let returnedSetupIntentId;
if (queryStr.length > 0) {
  const urlParams = new URLSearchParams(queryStr);
  returnedSetupIntentId = urlParams.get('setup_intent');
}

export default function CheckoutSuccess({
  user, setUser, setPlanToJoin, setPlanToView, setStripeClientSecret, setSetupIntentId,
}) {
  const navigate = useNavigate();

  useEffect(() => {
    setStripeClientSecret(null);
    setSetupIntentId(null);
    if (!returnedSetupIntentId || !/^seti_(?:[a-zA-Z0-9]{24})$/.test(returnedSetupIntentId)) {
      navigate('/404');
    }
  }, []);

  const { loading, data, error } = useQuery(SUBS_INFO, {
    variables: { setupIntentId: returnedSetupIntentId },
  });

  if (data) {
    const {
      planName, cycleFrequency, nextBillDate, personalCost,
      paymentMethod: {
        brand, last4, expiryMonth, expiryYear, default: isDefault,
      }
    } = data.successfulPayment;

    return (
      <Flex
        w="100%"
        minHeight="100vh"
        h="max-content"
        bg="#F5F5F5"
        align="center"
        direction="column"
      >
        <NavBar
          user={user}
          setUser={setUser}
          setPlanToJoin={setPlanToJoin}
          setPlanToView={setPlanToView}
        />
        <Card bg="white" my={14} variant="outline" w="xl">
          <CardHeader pt={10} px={12} pb={0}><Heading>{`Success! You joined ${planName}!`}</Heading></CardHeader>
          <CardBody px={12} py={8}>
            <VStack spacing={8}>
              <Text w="100%">Visit Plan Details to make changes to your subscription.</Text>
              <VStack w="100%" spacing={6}>
                <Heading w="100%" variant="nuanced">Plan details</Heading>
                <Container w="100%" ml={6}>
                  <Grid w="100%" templateColumns="2fr 3fr" templateRows="repeat(4, max-content)" rowGap={2} columnGap={6}>
                    <GridItem textStyle="gridTitle">Plan Name:</GridItem>
                    <GridItem>{planName}</GridItem>
                    <GridItem textStyle="gridTitle">Your Cycle Cost:</GridItem>
                    <GridItem>{personalCost}</GridItem>
                    <GridItem textStyle="gridTitle">Billing Frequency:</GridItem>
                    <GridItem>{cycleFrequency}</GridItem>
                    <GridItem textStyle="gridTitle">Start Date:</GridItem>
                    <GridItem>{nextBillDate}</GridItem>
                  </Grid>
                </Container>
              </VStack>
              <VStack w="100%" pt={4} spacing={6}>
                <Heading w="100%" variant="nuanced">Payment</Heading>
                <Container ml={6} w="100%">
                  <Text w="100%" fontWeight="600">
                    {`${brand[0].toUpperCase().concat(brand.slice(1))} ending in ${last4}`}
                    {isDefault && ' (default)'}
                  </Text>
                  <Text w="100%" textStyle="formSavedInput" fontSize="sm">{`Expires ${expiryMonth}/${expiryYear}`}</Text>
                </Container>
              </VStack>
            </VStack>
          </CardBody>
          <CardFooter px={12} pt={0} pb={10}>
            <Button type="button">Back to Dashboard</Button>
          </CardFooter>
        </Card>
      </Flex>
    );
  }
  return null;
}
