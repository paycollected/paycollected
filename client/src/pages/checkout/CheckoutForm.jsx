import React, { useState } from 'react';
import {
  useStripe, useElements, PaymentElement,
} from '@stripe/react-stripe-js';
import { useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import {
  Button, Card, CardHeader, CardBody, CardFooter, Heading, HStack, RadioGroup, Radio, VStack,
  Container, FormControl, FormLabel, FormHelperText, Input, Text,
} from '@chakra-ui/react';
import { CancelTransaction as CANCEL_TRANSC, SubscribeWithSavedCard as SUBSCRIBE } from '../../graphql/mutations.gql';
import SavedCards from './SavedCards.jsx';

export default function CheckoutForm({
  setupIntentId, paymentMethods, planId, setStripeClientSecret, setSetupIntentId,
}) {
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const [cancel, { loading }] = useMutation(CANCEL_TRANSC, {
    onCompleted: () => {
      setStripeClientSecret(null);
      setSetupIntentId(null);
      navigate('/dashboard');
    },
    onError: ({ message }) => {
      console.log(message);
    },
  });

  const [submitPayment, {
    data, loading: subscribeLoading, error: subscribeError
  }] = useMutation(SUBSCRIBE, {
    onCompleted: () => {
      navigate(`/checkout-success/?setup_intent=${setupIntentId}`);
    },
    onError: ({ message }) => {
      console.log('error subscribing using a saved card: ', message);
    },
  });

  const stripe = useStripe();
  const elements = useElements();
  const [selectedCard, setSelectedCard] = useState(
    paymentMethods.length === 0 ? 'newCard' : paymentMethods.filter((method) => (method.default))[0].id
  );


  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    if (selectedCard === 'newCard') {
      try {
        const { error: stripeError } = await stripe.confirmSetup({
          // Elements` instance that was used to create the Payment Element
          elements,
          confirmParams: {
            return_url: `${process.env.HOST}/checkout-success/`,
            // actual redirect URL string 'http://localhost:5647/dashboard/?setup_intent=seti_1Lq9rqAJ5Ik974ueIdg7WHn9&setup_intent_client_secret=seti_1Lq9rqAJ5Ik974ueIdg7WHn9_secret_MZISJyXsMF6na4pA6ryaqOfvt8JbeGa&redirect_status=succeeded'
            // correctly redirected to Successful Payment component!
            // Do we need query parameters in the redirection link?
          },
        });

        if (stripeError) { // error processing payment from Stripe
          console.log(stripeError);
          // may want to navigate to a payment Error page here
        }
      } catch (err) {
        console.log('This is a client side error:', err);
      }
    } else {
      submitPayment({
        variables: {
          paymentMethodId: selectedCard,
          setupIntentId,
          planId,
          password
        }
      });
    }
  };

  const handleCancel = () => {
    cancel({ variables: { setupIntentId } });
  };

  return (
    <Card bg="white" my={14} variant="outline" w="2xl">
      <form onSubmit={handlePaymentSubmit}>
        <CardHeader pt={10} px={12} pb={0}><Heading>Checkout</Heading></CardHeader>
        <CardBody px={12} py={8}>
          <VStack spacing={6}>
            <Heading w="100%" variant="nuanced">Select a payment method</Heading>
            <RadioGroup w="100%" onChange={setSelectedCard} value={selectedCard}>
              <VStack spacing={4}>
                {paymentMethods.length > 0 && (
                  <SavedCards
                    paymentMethods={paymentMethods}
                    setupIntentId={setupIntentId}
                    selectedCard={selectedCard}
                    setSelectedCard={setSelectedCard}
                  />
                )}
                <Container w="100%" p={0}>
                  <Radio value="newCard" checked={selectedCard === 'newCard'}>
                    <Text pl={4} fontWeight="600">Use a new card</Text>
                  </Radio>
                </Container>
              </VStack>
            </RadioGroup>
            <Container w="100%" px={0} pt={3} hidden={selectedCard !== 'newCard'}>
              <PaymentElement />
            </Container>
            <FormControl hidden={selectedCard === 'newCard'} isRequired={selectedCard !== 'newCard'}>
              <FormLabel>Your password:</FormLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <FormHelperText>
                To use a saved card, please retype your password to confirm your identity.
              </FormHelperText>
            </FormControl>
          </VStack>
        </CardBody>
        <CardFooter px={12} pt={0} pb={10}>
          <HStack spacing={6}>
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button type="submit" disabled={!stripe}>Set up payment</Button>
          </HStack>
        </CardFooter>
      </form>
    </Card>
  );
}
