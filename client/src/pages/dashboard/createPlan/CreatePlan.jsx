import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { useForm } from 'react-hook-form';
import {
  Button, Input, Select, InputGroup, InputLeftElement,
  FormControl, FormLabel, FormErrorMessage,
  Box, Heading, Flex
} from '@chakra-ui/react';
import { CreatePlanMutation as CREATE_PLAN } from '../../../graphql/mutations.gql';

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const oneMonthFromTmr = new Date(tomorrow);
oneMonthFromTmr.setMonth(tomorrow.getMonth() + 1);
// we'll limit users to a start date that is between tomorrow and 1 month from then

const processDateStr = (date) => {
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // month is zero-th indexed
  const dateStr = (date.getDate()).toString().padStart(2, '0'); // starting tomorrow
  return `${year}-${month}-${dateStr}`;
};

const fullDate = processDateStr(tomorrow);
const nextMonthFullDate = processDateStr(oneMonthFromTmr);

export default function CreatePlan({ setPlanToJoin, setShowMagicLink }) {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [startDate, setStartDate] = useState(fullDate);

  const [createNewPlan, { data, loading, error }] = useMutation(CREATE_PLAN, {
    onCompleted: ({ createPlan: { planId } }) => {
      setPlanToJoin(planId);
      setShowMagicLink(true);
    },
    onError: ({ message }) => {
      console.log('error creating plan: ', message);
    },
  });

  const onSubmit = ({
    planName, cycleFrequency, perCycleCost
  }) => {
    createNewPlan({
      variables: {
        planName,
        cycleFrequency: cycleFrequency.toUpperCase(),
        perCycleCost: Number(perCycleCost),
        startDate,
      },
    });
  };

  return (
    <Flex width="fill" align="center" justifyContent="center">
      <Box p={2} my={8} width="40%" bg="white" borderRadius="15">
        <Heading>Create a New Plan</Heading>
        <Box my={4} textAlign="left">
          <form
            autoComplete="off"
            onSubmit={handleSubmit(onSubmit)}
          >
            <FormControl
              isRequired
              isInvalid={errors.planName}
            >
              <FormLabel>Plan Name</FormLabel>
              <Input
                name="planName"
                placeholder="Plan Name"
                type="text"
                {...register('planName', { required: 'Plan name required' })}
              />
              {errors.planName ? (
                <FormErrorMessage>
                  {errors.planName.message}
                </FormErrorMessage>
              ) : (
                <div>&nbsp;</div>
              )}
            </FormControl>
            <FormControl
              isRequired
              isInvalid={errors.cycleFrequency}
            >
              <FormLabel>Cycle Frequency</FormLabel>
              <Select
                variant="outline"
                name="cycleFrequency"
                placeholder="Select a Cycle Frequency"
                {...register('cycleFrequency', { required: 'Select cycle frequency' })}
              >
                {['Weekly', 'Monthly', 'Yearly'].map((freq) => (
                  <option key={freq} value={freq}>
                    {freq}
                  </option>
                ))}
              </Select>
              {errors.cycleFrequency ? (
                <FormErrorMessage>
                  {errors.cycleFrequency.message}
                </FormErrorMessage>
              ) : (
                <div>&nbsp;</div>
              )}
            </FormControl>
            <FormControl
              isRequired
              isInvalid={errors.perCycleCost}
            >
              <FormLabel>Per-Cycle Cost</FormLabel>
              <InputGroup>
                <InputLeftElement
                  children='$'
                />
                <Input
                  name="perCycleCost"
                  placeholder="Per-Cycle Cost"
                  type="text"
                  {...register('perCycleCost', {
                    required: 'Enter total cost per pay cycle',
                    validate: (val) => Number.isInteger(Number(val) * 100) && Number(val) >= 10 || 'Cost must be a valid amount in US dollars at least $10'
                  })}
                />
              </InputGroup>
              {errors.perCycleCost ? (
                <FormErrorMessage>
                  {errors.perCycleCost.message}
                </FormErrorMessage>
              ) : (
                <div>&nbsp;</div>
              )}
            </FormControl>
            <FormControl
              isRequired
            >
              <FormLabel>Start Date</FormLabel>
              <Input
                type="date"
                value={startDate}
                min={fullDate}
                max={nextMonthFullDate}
                onChange={(e) => { setStartDate(e.target.value); }}
              />
            </FormControl>
            <div>&nbsp;</div>
            <Button type="submit" isLoading={loading} disabled={loading}>Submit</Button>
            <Button onClick={() => { navigate('/dashboard'); }}>Cancel</Button>
          </form>
        </Box>
      </Box>
    </Flex>
  );
}
