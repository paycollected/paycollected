import React, { useState } from 'react';
import {
  useStripe, useElements, PaymentElement,
} from '@stripe/react-stripe-js';
import { useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import {
  Button, Card, CardHeader, CardBody, CardFooter, Heading, HStack, RadioGroup, Radio, VStack,
  Container, FormControl, FormLabel, FormHelperText, Input,
} from '@chakra-ui/react';
import { CancelTransaction as CANCEL_TRANSC, SubscribeWithSavedCard as SUBSCRIBE } from '../../graphql/mutations.gql';
import SavedCards from './SavedCards.jsx';

export default function CheckoutForm({ setupIntentId, paymentMethods, planId }) {
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  // CACHE IS UPDATING CORRECTLY
  // BUT UI IN PlansTable is not rendering from cache??
  const [cancel, { loading }] = useMutation(CANCEL_TRANSC, {
    onCompleted: () => {
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
      // navigate('/dashboard');
      navigate('/plan/all');
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
            return_url: `${process.env.HOST}/dashboard/`,
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
    <Card bg="white" mt={20} variant="outline" w="lg">
      <form onSubmit={handlePaymentSubmit}>
        <CardHeader pt={10} px={12} pb={0}><Heading>Checkout</Heading></CardHeader>
        <CardBody px={12} py={8}>
          <RadioGroup onChange={setSelectedCard} value={selectedCard}>
            <VStack spacing={4}>
              <>
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
                    Use a new card
                  </Radio>
                </Container>
              </>
              <Container w="100%" p={0} hidden={selectedCard !== 'newCard'}>
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
          </RadioGroup>
        </CardBody>
        <CardFooter px={12} pt={0} pb={10}>
          <HStack spacing={4}>
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button type="submit" disabled={!stripe}>Set up payment</Button>
          </HStack>
        </CardFooter>
      </form>
    </Card>
  );
}
