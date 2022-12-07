import React from 'react';

export default function SavedCards({ setSelectedCard, selectedCard, paymentMethods }) {
  return (
    <>
      {paymentMethods.map((method) => (
        <div key={method.id}>
          <input
            type="radio"
            value={method.id}
            checked={method.id === selectedCard}
            onChange={(e) => { setSelectedCard(e.target.value); }}
          />
          {`${method.brand} ending in ${method.last4} (exp: ${method.expiryMonth}/${method.expiryYear})`}
          {method.default && '(default)'}
        </div>
      ))}
    </>
  );
}
