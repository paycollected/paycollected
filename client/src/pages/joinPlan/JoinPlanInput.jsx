import React from 'react';
import {
  FormControl, FormLabel, FormHelperText, FormErrorMessage, NumberInput, NumberInputField,
  NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper,
} from '@chakra-ui/react';


export default function JoinPlanInput({
  register, errors, totalQuantity, perCycleCost, cycleFrequency,
}) {
  return (
    <>
      <FormControl isRequired isInvalid={errors.quantity}>
        <FormLabel textStyle="gridTitle" htmlFor="quantity">Subscriptions:</FormLabel>
        <NumberInput defaultValue={1} min={1}>
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
      <h1>Random</h1>
    </>
  );
}
