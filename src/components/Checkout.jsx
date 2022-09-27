import React from 'react';
import {
  useStripe, useElements, CardElement, Elements
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.STRIPE_PUBLISHABLE_KEY);

export default function Checkout({ stripeClientSecret }) {
  const stripe = useStripe();
  const elements = useElements();

  const options = {
    clientSecret: stripeClientSecret
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <h1>This is the Checkout page</h1>
    </Elements>
  );
}
