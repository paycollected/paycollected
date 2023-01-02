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
        <Elements stripe={stripePromise} options={options}>
          <CheckoutForm
            setupIntentId={setupIntentId}
            paymentMethods={paymentMethods}
            planId={planId}
          />
        </Elements>
      </Flex>
    );
  }
  return null;
}
