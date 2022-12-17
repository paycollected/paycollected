import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { useForm } from 'react-hook-form';
import {
  FormControl, FormLabel, FormErrorMessage, FormHelperText, InputGroup, InputLeftElement,
  Box, Stack, Button, Input, Select, HStack, useBreakpointValue,
  Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton, DrawerHeader, DrawerBody, DrawerFooter
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

export default function CreatePlanDrawer({
  isOpen, onClose, setPlanToJoin, onOpenCreatePlanSuccess
}) {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [startDate, setStartDate] = useState(fullDate);

  const [createNewPlan, { data, loading, error }] = useMutation(CREATE_PLAN, {
    onCompleted: ({ createPlan: { planId } }) => {
      setPlanToJoin(planId);
      onOpenCreatePlanSuccess();
      onClose();
    },
    onError: ({ message }) => {
      console.log('error creating plan: ', message);
    },
  });

  const onSubmit = ({
    planName, billingFrequency, perCycleCost
  }) => {
    createNewPlan({
      variables: {
        planName,
        cycleFrequency: billingFrequency.toUpperCase(),
        perCycleCost: Number(perCycleCost),
        startDate,
      },
    });
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} placement="right" size={isMobile ? 'full' : 'md'}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader color="#2B6CB0">Create plan</DrawerHeader>
        <DrawerBody>
          <Stack spacing="3">
            <Box>
              Create a new plan with your friends. Fill in the details below to get started.
            </Box>
            <form
              autoComplete="off"
              id="create-plan-form"
              onSubmit={handleSubmit(onSubmit)}
            >
              <FormControl
                isRequired
                isInvalid={errors.planName}
              >
                <FormLabel htmlFor="planName">Plan Name</FormLabel>
                <Input
                  name="planName"
                  type="text"
                  autoFocus="true"
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
                isInvalid={errors.perCycleCost}
              >
                <FormLabel htmlFor="perCycleCost">Per Cycle Cost</FormLabel>
                <InputGroup>
                  <InputLeftElement children="$" />
                  <Input
                    name="perCycleCost"
                    type="text"
                    {...register('perCycleCost', {
                      required: 'Enter total cost per pay cycle',
                      validate: (val) => Number.isInteger(Number(val) * 100) && Number(val) >= 10 || 'Cost must be a valid amount in US dollars at least $10'
                    })}
                  />
                </InputGroup>
                <FormHelperText>Total cost per billing cycle (i.e., #100 a week)</FormHelperText>
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
                isInvalid={errors.cycleFrequency}
              >
                <FormLabel htmlFor="billingFrequency">Billing Frequency</FormLabel>
                <Select
                  variant="outline"
                  name="billingFrequency"
                  {...register('billingFrequency', { required: 'Select billing frequency' })}
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
            </form>
          </Stack>
        </DrawerBody>
        <DrawerFooter borderTopWidth="1px">
          <HStack width="100%" justify="space-between">
            <Button variant="outline" width="45%" onClick={onClose}>Cancel</Button>
            <Button variant="solid" width="45%" type="submit" form="create-plan-form" isLoading={loading} disabled={loading}>Create Plan</Button>
          </HStack>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
