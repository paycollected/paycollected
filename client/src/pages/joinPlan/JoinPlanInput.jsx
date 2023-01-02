import React, { useEffect, useState } from 'react';
import {
  FormControl, FormLabel, FormHelperText, FormErrorMessage, NumberInput, NumberInputField,
  NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper, Box, Input, Text, HStack,
} from '@chakra-ui/react';
import { Controller } from 'react-hook-form';

const calculateCost = (quantity, perCycleCost, totalQuantity) => {
  const totalCost = Number(perCycleCost.slice(1)) * 100;
  return (Math.ceil(totalCost / (quantity + totalQuantity)) / 100).toFixed(2);
};

export default function JoinPlanInput({
  errors, totalQuantity, perCycleCost, cycleFrequency, watchQuantityInput, control
}) {
  const [cost, setCost] = useState(calculateCost(watchQuantityInput, perCycleCost, totalQuantity));
  useEffect(
    () => {
      if (Number.isInteger(watchQuantityInput) && watchQuantityInput > 0) {
        setCost(calculateCost(watchQuantityInput, perCycleCost, totalQuantity));
      }
    },
    [watchQuantityInput, perCycleCost, totalQuantity]
  );

  return (
    <Box w="70%">
      <Box mb={8}>
        <FormControl isRequired isInvalid={errors.quantity}>
          <FormLabel textStyle="gridTitle" htmlFor="quantity">Subscriptions:</FormLabel>
          <Controller
            control={control}
            name="quantity"
            rules={{
              required: "Number of subscriptions is required",
              min: { value: 1, message: 'A minimum of 1 subscription is required' },
            }}
            render={({ field }) => (
              <NumberInput
                id="quantity"
                variant="placeholder"
                defaultValue={1}
                min={1}
                {...field}
                onChange={(val) => {
                  if (/^\d+$/.test(val)) field.onChange(Number(val));
                  else if (val === '') field.onChange(val);
                }}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            )}
          />
          <FormHelperText>The number of subscriptions you will pay for</FormHelperText>
          <FormErrorMessage>{errors.quantity && errors.quantity.message}</FormErrorMessage>
        </FormControl>
      </Box>
      <HStack spacing={6}>
        <Text>Your cycle cost:</Text>
        <HStack w="max-content">
          <Input
            size="sm"
            type="text"
            w={24}
            bg="gray.100"
            borderColor="gray.200"
            borderRadius="6px"
            color="gray.700"
            fontSize="16px"
            readOnly
            value={`$${cost}`}
          />
          <Text>{`/ ${cycleFrequency[0].toLowerCase().concat(cycleFrequency.slice(1))}`}</Text>
        </HStack>
      </HStack>
    </Box>

  );
}
