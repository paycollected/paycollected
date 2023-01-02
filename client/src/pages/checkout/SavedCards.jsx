import React from 'react';
import {
  Radio, Container, VStack, Text,
} from '@chakra-ui/react';

export default function SavedCards({ selectedCard, paymentMethods }) {
  return (
    <>
      {paymentMethods.map((method) => (
        <Container w="100%" p={0}>
          <Radio key={method.id} value={method.id} checked={method.id === selectedCard}>
            <VStack pl={4} spacing={0}>
              <Text w="100%" fontWeight="600">
                {`${method.brand[0].toUpperCase() + method.brand.slice(1)} ending in ${method.last4} `}
                {method.default && '(default)'}
              </Text>
              <Text w="100%" textStyle="formSavedInput" fontSize="sm">{`Expires ${method.expiryMonth}/${method.expiryYear}`}</Text>
            </VStack>
          </Radio>
        </Container>
      ))}
    </>
  );
}
