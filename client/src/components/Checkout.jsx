import React, { useState } from 'react';
import {
  useStripe, useElements, Elements, PaymentElement,
} from '@stripe/react-stripe-js';
import { useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import {
  Flex, Box, FormControl, FormLabel, FormErrorMessage, Button, Input
} from '@chakra-ui/react';
import { loadStripe } from '@stripe/stripe-js';
import { CancelTransaction as CANCEL_TRANSC, SubscribeWithSavedCard as SUBSCRIBE } from '../graphql/mutations.gql';
import SavedCards from './SavedCards.jsx';

const stripePromise = loadStripe(process.env.STRIPE_PUBLISHABLE_KEY);

function CheckoutForm({ setupIntentId, paymentMethods }) {
  const navigate = useNavigate();
  const [cancel, { loading }] = useMutation(CANCEL_TRANSC, {
    onCompleted: () => {
      navigate('/dashboard');
    },
    onError: ({ message }) => {
      console.log(message);
    },
  });

  const [submitPayment, { data, loading: subscribeLoading, error }] = useMutation(SUBSCRIBE, {
    onCompleted: () => {
      navigate('/dashboard');
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
        const { error } = await stripe.confirmSetup({
          // Elements` instance that was used to create the Payment Element
          elements,
          confirmParams: {
            return_url: 'http://localhost:5647/dashboard/',
            // actual redirect URL string 'http://localhost:5647/dashboard/?setup_intent=seti_1Lq9rqAJ5Ik974ueIdg7WHn9&setup_intent_client_secret=seti_1Lq9rqAJ5Ik974ueIdg7WHn9_secret_MZISJyXsMF6na4pA6ryaqOfvt8JbeGa&redirect_status=succeeded'
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
    } else {
      submitPayment({
        variables: {
          paymentMethodId: selectedCard,
          setupIntentId
        }
      });
    }
  };

  const handleCancel = () => {
    cancel({ variables: { setupIntentId } });
  };

  return (
    <>
      <h3>This is the Checkout Form component</h3>
      {console.log('-----------> selectedCard', selectedCard)}
      <form onSubmit={handlePaymentSubmit}>
        {paymentMethods.length > 0 && (
          <SavedCards
            paymentMethods={paymentMethods}
            setupIntentId={setupIntentId}
            selectedCard={selectedCard}
            setSelectedCard={setSelectedCard}
          />
        )}
        <div>
          <input
            type="radio"
            value="newCard"
            checked={selectedCard === 'newCard'}
            onChange={(e) => setSelectedCard(e.target.value)}
          />
          Use a new card
          <div hidden={selectedCard !== 'newCard'}>
            <PaymentElement />
          </div>
        </div>
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

export default function Checkout({
  stripeClientSecret, setupIntentId, paymentMethods,
}) {
  const options = {
    clientSecret: stripeClientSecret
  };

  if (stripeClientSecret && stripeClientSecret.length > 0) {
    return (
      <div>
        <h1>This is the Checkout page with a Client Secret</h1>
        <Elements stripe={stripePromise} options={options}>
          <h2>Use a new card!</h2>
          <CheckoutForm
            setupIntentId={setupIntentId}
            paymentMethods={paymentMethods}
          />
        </Elements>
      </div>
    );
  }
  return (
    <h1>This is the Checkout page with no Client Secret</h1>
  );
}
