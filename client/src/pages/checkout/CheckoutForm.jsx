import React, { useState } from 'react';
import {
  useStripe, useElements, PaymentElement,
} from '@stripe/react-stripe-js';
import { useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@chakra-ui/react';
import { CancelTransaction as CANCEL_TRANSC, SubscribeWithSavedCard as SUBSCRIBE } from '../../graphql/mutations.gql';
import SavedCards from './SavedCards.jsx';

export default function CheckoutForm({ setupIntentId, paymentMethods, planId }) {
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  // CACHE IS UPDATING CORRECTLY
  // BUT UI IN PlansTable is not rendering from cache??
  const [cancel, { loading }] = useMutation(CANCEL_TRANSC, {
    onCompleted: () => {
      navigate('/plan/all');
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
    <>
      <h3>This is the Checkout Form component</h3>
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
          <div hidden={selectedCard === 'newCard'}>
            To use a saved card, please retype your password to confirm identity:
            <input
              type="password"
              value={password}
              required={selectedCard !== 'newCard'}
              onChange={(e) => { setPassword(e.target.value); }}
            />
          </div>
        </div>
        <Button type="submit" disabled={!stripe}>Make payment</Button>
        <Button onClick={handleCancel}>Cancel</Button>
      </form>
    </>
  );
}
