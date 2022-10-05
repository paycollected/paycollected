import React, { useEffect } from 'react';

const paymentIntentId = localStorage.getItem('clientSecret');

export default function PaymentSuccess() {
  useEffect(() => {
    if (paymentIntentId) {
      localStorage.removeItem('clientSecret');
    }
  });

  if (paymentIntentId) {
    return (
      <h1>This is the Successful Payment Page</h1>
    );
  }
  return null;
}
