import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Flex } from '@chakra-ui/react';
import CheckoutForm from './CheckoutForm.jsx';
import NavBar from '../../components/NavBar.jsx';

const stripePromise = loadStripe(process.env.STRIPE_PUBLISHABLE_KEY);


export default function Checkout({
  stripeClientSecret, setupIntentId, paymentMethods, planId, user, setUser, setPlanToJoin,
  setPlanToView,
}) {
  const options = { clientSecret: stripeClientSecret };

  if (stripeClientSecret && stripeClientSecret.length > 0) {
    return (
      <>
        <NavBar
          user={user}
          setUser={setUser}
          setPlanToJoin={setPlanToJoin}
          setPlanToView={setPlanToView}
        />
        <Elements stripe={stripePromise} options={options}>
          <Flex
            mt={-8}
            w="100%"
            minHeight="100vh"
            h="max-content"
            bg="#F5F5F5"
            direction="column"
            align="center"
            justify="center"
          >
            <CheckoutForm
              setupIntentId={setupIntentId}
              paymentMethods={paymentMethods}
              planId={planId}
            />
          </Flex>
        </Elements>
      </>
    );
  }
  return null;
}
