import React from 'react';
import {
  useStripe, useElements, CardElement, Elements
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.STRIPE_PUBLISHABLE_KEY);

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }
    const { error } = await stripe.confirmPayment({
      //`Elements` instance that was used to create the Payment Element
      elements,
      confirmParams: {
        return_url: 'http://localhost:2891/',
      },
    });

    if (error) {// error processing payment from Stripe
      console.log(error);
    }
  };

  return (
    <>
      <h3>This is the Checkout Form component</h3>
      <form onSubmit={handlePaymentSubmit}>
        <CardElement />
        <button type="submit">Make payment</button>
      </form>
    </>
  );
}

/*
after clicking pay but not completing the checkout process,
when coming back to the checkout page the client secret is lost if not saved somewhere
*/
export default function Checkout({ stripeClientSecret }) {
  const options = {
    clientSecret: stripeClientSecret
  };

  if (stripeClientSecret && stripeClientSecret.length > 0) {
    return (
      <Elements stripe={stripePromise} options={options}>
        <h1>This is the Checkout page with a Client Secret</h1>
        <CheckoutForm stripeClientSecret={stripeClientSecret} />
      </Elements>
    );
  }
  return (
    <h1>This is the Checkout page with no Client Secret</h1>
  );
}
