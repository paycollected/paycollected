import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  FormControl, FormLabel, FormErrorMessage, FormHelperText, InputGroup, InputLeftElement,
  Box, Stack, Button, Input, Select, HStack, DrawerHeader, DrawerBody, DrawerFooter, Text,
} from '@chakra-ui/react';

// users limited to a start date that is between tomorrow and 1 month from then
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const oneMonthFromTmr = new Date(tomorrow);
oneMonthFromTmr.setMonth(tomorrow.getMonth() + 1);

const processDateStr = (date) => {
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // month is zero-th indexed
  const dateStr = (date.getDate()).toString().padStart(2, '0'); // starting tomorrow
  return `${year}-${month}-${dateStr}`;
};

const fullDate = processDateStr(tomorrow);
const nextMonthFullDate = processDateStr(oneMonthFromTmr);

export default function CreatePlanForm({ createNewPlan, onCloseDrawer, loading,

}) {
  const { register, handleSubmit, formState: { errors } } = useForm({ shouldUnregister: true });
  const [startDate, setStartDate] = useState(fullDate);
  const onSubmit = ({
    planName, billingFrequency, perCycleCost
  }) => {
    let fCost;
    if (/^[1-9]([0-9]+).([0-9]{2})$/.test(perCycleCost)) fCost = `$${perCycleCost}`;
    else fCost = `$${perCycleCost}.00`;
    createNewPlan({
      variables: {
        planName,
        cycleFrequency: billingFrequency.toUpperCase(),
        perCycleCost: fCost,
        startDate,
      },
    });
  };

  return (
    <>
      <DrawerHeader pt={4}>
        <Text color="#2B6CB0" fontSize="3xl">
          Create plan
        </Text>
      </DrawerHeader>
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
                autoFocus
                {...register('planName', {
                  required: 'Plan name required',
                  minLength: { value: 5, message: 'Plan name must be at least 5 characters'},
                  maxLength: { value: 100, message: 'Plan name must be no more than 100 characters'},
                  setValueAs: (name) => name.trim(),
                })}
              />
              {errors.planName ? (
                <FormErrorMessage>
                  {errors.planName.message}
                </FormErrorMessage>
              ) : (
                <>&nbsp;</>
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
                    validate: (val) => Number(val) >= 10 && Number(val) <= 999999.99 || 'Cost must be at least $10 and no more than $999,999.99',
                    pattern: {
                      value: /^(([1-9]([0-9]+)\.([0-9]{2}))|([1-9]([0-9]+)))$/,
                      message: 'Input must only contain digits, and a period (optional)',
                    },
                  })}
                />
              </InputGroup>
              <FormHelperText>
                Total cost per billing cycle for everyone in the plan (i.e., $100 a week)
              </FormHelperText>
              {errors.perCycleCost ? (
                <FormErrorMessage>
                  {errors.perCycleCost.message}
                </FormErrorMessage>
              ) : (
                <>&nbsp;</>
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
                <>&nbsp;</>
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
        <HStack width="100%" justify="space-between" pt={2}>
          <Button variant="outline" width="45%" onClick={onCloseDrawer}>Cancel</Button>
          <Button variant="solid" width="45%" type="submit" form="create-plan-form" isLoading={loading} disabled={loading}>Create Plan</Button>
        </HStack>
      </DrawerFooter>
    </>
  );
}
