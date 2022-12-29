import React from 'react';
import {
  FormControl, FormLabel, FormHelperText, FormErrorMessage, NumberInput, NumberInputField,
  NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper, Box, Input, Text, HStack,
} from '@chakra-ui/react';


export default function JoinPlanInput({
  register, errors, totalQuantity, perCycleCost, cycleFrequency, watchQuantityInput,
}) {
  const calculateCost = (quantity) => {
    const totalCost = Number(perCycleCost.slice(1)) * 100;
    return Math.ceil(totalCost / (quantity + totalQuantity)) / 100;
  };

  return (
    <Box w="70%">
      <Box mb={8}>
        <FormControl isRequired isInvalid={errors.quantity}>
          <FormLabel textStyle="gridTitle" htmlFor="quantity">Subscriptions:</FormLabel>
          <NumberInput variant="placeholder" defaultValue={1} min={1}>
            <NumberInputField
              id="quantity"
              {...register('quantity', {
                required: "Number of subscriptions is required",
                min: { value: 1, message: 'A minimum of 1 subscription is required' },
                valueAsNumber: true,
              })}
            />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          <FormHelperText>The number of subscriptions you will pay for</FormHelperText>
          <FormErrorMessage>{errors.quantity && errors.quantity.message}</FormErrorMessage>
        </FormControl>
      </Box>
      <HStack spacing={6}>
        <Text>Your cycle cost:</Text>
        {console.log(watchQuantityInput, typeof watchQuantityInput)}
        <HStack w="max-content">
          <Input
            size="sm"
            type="text"
            w={14}
            bg="gray.100"
            borderColor="gray.200"
            borderRadius="6px"
            color="gray.700"
            fontSize="16px"
            readOnly
            value={`$${calculateCost(watchQuantityInput)}`}
          />
          <Text>{`/ ${cycleFrequency[0].toLowerCase().concat(cycleFrequency.slice(1))}`}</Text>
        </HStack>
      </HStack>
    </Box>

  );
}
