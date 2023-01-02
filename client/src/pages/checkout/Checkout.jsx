import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutForm from './CheckoutForm.jsx';

const stripePromise = loadStripe(process.env.STRIPE_PUBLISHABLE_KEY);


export default function Checkout({
  stripeClientSecret, setupIntentId, paymentMethods, planId
}) {
  const options = { clientSecret: stripeClientSecret };

  if (stripeClientSecret && stripeClientSecret.length > 0) {
    return (
      <div>
        <h1>This is the Checkout page with a Client Secret</h1>
        <Elements stripe={stripePromise} options={options}>
          <h2>Use a new card!</h2>
          <CheckoutForm
            setupIntentId={setupIntentId}
            paymentMethods={paymentMethods}
            planId={planId}
          />
        </Elements>
      </div>
    );
  }
  return null;
}
