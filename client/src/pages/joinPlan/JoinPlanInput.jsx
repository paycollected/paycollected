import React from 'react';
import {
  FormControl, FormLabel, FormHelperText, FormErrorMessage, NumberInput, NumberInputField,
  NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper,
} from '@chakra-ui/react';
import { useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { JoinPlan as JOIN_PLAN } from '../../graphql/mutations.gql';


export default function JoinPlanInput({
  totalQuantity, perCycleCost, cycleFrequency, setStripeClientSecret, setSetupIntentId,
  setPaymentMethods, planId,
}) {
  const navigate = useNavigate();
  // will need to handle this payLoading state on client side so user knows what to expect
  const [makePayment, { loading, error}] = useMutation(
    JOIN_PLAN,
    {
      onCompleted: ({ joinPlan: { clientSecret, setupIntentId, paymentMethods } }) => {
        setStripeClientSecret(clientSecret);
        setSetupIntentId(setupIntentId);
        setPaymentMethods(paymentMethods);
        navigate('/checkout');
      },
      onError: ({ message }) => { console.log(message); },
    }
  );

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = ({ quantity }) => {
    makePayment({ variables: { planId, quantity } });
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormControl isRequired isInvalid={errors.quantity}>
          <FormLabel htmlFor="quantity">Subscriptions:</FormLabel>
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
      </form>
      <h1>Random</h1>
    </>

  );
}
