import React from 'react';
import {
  useStripe, useElements, Elements, PaymentElement, LinkAuthenticationElement,
} from '@stripe/react-stripe-js';
import { Flex, Box, FormControl, FormLabel, FormErrorMessage, Button, Input } from '@chakra-ui/react';
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
      const { error } = await stripe.confirmSetup({
        // Elements` instance that was used to create the Payment Element
        elements,
        confirmParams: {
          return_url: 'http://localhost:5647/payment-success/',
          // actual redirect URL string 'http://localhost:5647/payment-success/?setup_intent=seti_1Lq9rqAJ5Ik974ueIdg7WHn9&setup_intent_client_secret=seti_1Lq9rqAJ5Ik974ueIdg7WHn9_secret_MZISJyXsMF6na4pA6ryaqOfvt8JbeGa&redirect_status=succeeded'
          // correctly redirected to Successful Payment component!
          // Do we need query parameters in the redirection link?
        },
      });

      if (error) { // error processing payment from Stripe
        console.log(error);
        // may want to navigate to a payment Error page here
      }
    } catch (err) {
      console.log('This is a client side error:', err);
    }
  };

  const handleCancel = async () => {
    // TODO: navigate back to dashboard or join plan page
    // delete subscription
  }

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
        <button type="button" onClick={handleCancel}>Cancel</button>
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
