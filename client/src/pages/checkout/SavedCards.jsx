import React from 'react';
import { Radio, Container } from '@chakra-ui/react';

export default function SavedCards({ selectedCard, paymentMethods }) {
  return (
    <>
      {paymentMethods.map((method) => (
        <Container w="100%" p={0}>
          <Radio key={method.id} value={method.id} checked={method.id === selectedCard}>
            {`${method.brand} ending in ${method.last4} (exp: ${method.expiryMonth}/${method.expiryYear})`}
            {method.default && '(default)'}
          </Radio>
        </Container>
      ))}
    </>
  );
}
