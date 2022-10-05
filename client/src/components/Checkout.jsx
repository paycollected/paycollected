import React from 'react';
import {
  useStripe, useElements, Elements, PaymentElement, LinkAuthenticationElement,
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
    try {
      const { error } = await stripe.confirmPayment({
        // Elements` instance that was used to create the Payment Element
        elements,
        confirmParams: {
          return_url: 'http://localhost:2891/payment-success/',
          // actual redirect URL string 'http://localhost:2891/payment-success/?payment_intent=pi_3LmvGnAJ5Ik974ue1pMLTTnB&payment_intent_client_secret=pi_3LmvGnAJ5Ik974ue1pMLTTnB_secret_8BraUagRkakm4GC2RiHgCLk5u&redirect_status=succeeded'
          // correctly redirected to Successful Payment component!
          // Do we need query parameters in the redirection link?
        },
      });

      if (error) {// error processing payment from Stripe
        console.log(error);
        // may want to navigate to a payment Error page here
      }
    } catch (err) {
      console.log('This is a client side error:', err);
    }
  };

  return (
    <>
      <h3>This is the Checkout Form component</h3>
      <form onSubmit={handlePaymentSubmit}>
        <LinkAuthenticationElement />
        <PaymentElement
          options={
            {
              defaultValues: {
                billingDetails: {
                  email: localStorage.getItem('email'),
                }
              }
            }
          }
        />
        <button type="submit" disabled={!stripe}>Make payment</button>
      </form>
    </>
  );
}

/*
after clicking pay but not completing the checkout process,
when coming back to the checkout page the client secret is lost if not saved somewhere

on another note, subscription will expire if not followed up with payment
--> will prob need to set up webhooks
how does this affect what we store in db?
*/

export default function Checkout({ stripeClientSecret }) {
  const options = {
    clientSecret: stripeClientSecret
  };

  if (stripeClientSecret && stripeClientSecret.length > 0) {
    return (
      <Elements stripe={stripePromise} options={options}>
        <h1>This is the Checkout page with a Client Secret</h1>
        <CheckoutForm />
      </Elements>
    );
  }
  return (
    <h1>This is the Checkout page with no Client Secret</h1>
  );
}
