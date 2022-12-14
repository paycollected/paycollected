import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Flex } from '@chakra-ui/react';
import CheckoutForm from './CheckoutForm.jsx';
import NavBar from '../../components/NavBar.jsx';
import { stripePaymentElementAppearance } from '../../styles/styles.js';

const stripePromise = loadStripe(process.env.STRIPE_PUBLISHABLE_KEY);


export default function Checkout({
  stripeClientSecret, setupIntentId, paymentMethods, planId, user, setUser, setPlanToJoin,
  setPlanToView, setStripeClientSecret, setSetupIntentId, setSuccessPlan,
}) {
  const options = { clientSecret: stripeClientSecret, appearance: stripePaymentElementAppearance };

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
          setSuccessPlan={setSuccessPlan}
        />
        <Elements stripe={stripePromise} options={options}>
          <CheckoutForm
            setupIntentId={setupIntentId}
            paymentMethods={paymentMethods}
            planId={planId}
            setSetupIntentId={setSetupIntentId}
            setStripeClientSecret={setStripeClientSecret}
          />
        </Elements>
      </Flex>
    );
  }
  return null;
}
