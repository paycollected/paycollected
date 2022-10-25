import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { SubscribeWithSavedCard as SUBSCRIBE } from '../graphql/mutations.gql';

export default function SavedCards({ paymentMethods, subscriptionInTransaction: subscriptionId }) {
  const navigate = useNavigate();
  const [selectedCard, setSelectedCard] = useState(paymentMethods[0].id);
  const [submitPayment, { data, loading, error }] = useMutation(SUBSCRIBE, {
    onCompleted: () => {
      navigate('/dashboard');
    },
    onError: ({ message }) => {
      console.log('error subscribing using a saved card: ', message);
    },
  });

  const handleSubmit = () => {
    submitPayment({
      variables: {
        paymentMethodId: selectedCard,
        subscriptionId
      }
    });
  };

  return (
    <div>
      <h2>Choose among your saved cards:</h2>
      {paymentMethods.map((method) => (
        <div key={method.id}>
          <input
            type="radio"
            value={method.id}
            checked={method.id === selectedCard}
            onChange={(e) => { setSelectedCard(e.target.value); }}
          />
          {`${method.brand} ending in ${method.last4} (exp: ${method.expiryMonth}/${method.expiryYear})`}
        </div>
      ))}
      <button type="button" onClick={handleSubmit}>Join plan with a saved card!</button>
    </div>
  );
}
