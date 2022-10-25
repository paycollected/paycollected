import React, { useState } from 'react';
import { useMutation } from '@apollo/client';

export default function SavedCards({ paymentMethods, subscriptionInTransaction }) {
  const [selectedCard, setSelectedCard] = useState(paymentMethods[0].id);
  const [submitPayment] = useMutation();

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
      <button type="button" onClick={}>Join plan with a saved card!</button>
    </div>
  );
}
