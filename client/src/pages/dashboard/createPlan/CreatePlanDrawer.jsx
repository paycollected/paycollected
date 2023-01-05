import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  FormControl, FormLabel, FormErrorMessage, FormHelperText, InputGroup, InputLeftElement,
  Box, Stack, Button, Input, Select, HStack, useBreakpointValue, useClipboard,
  Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton, DrawerHeader, DrawerBody, DrawerFooter,
  TableContainer, Table, Tbody, Tr, Td, VStack, Flex, InputRightAddon, Text, Center,
} from '@chakra-ui/react';
import { CreatePlanMutation as CREATE_PLAN } from '../../../graphql/mutations.gql';
import { ViewAllPlans as GET_PLANS } from '../../../graphql/queries.gql';

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

export default function CreatePlanDrawer({ isOpen, onClose, setPlanToJoin }) {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm({ shouldUnregister: true });
  const [startDate, setStartDate] = useState(fullDate);
  // conditionally render create plan form vs success page
  const [success, setSuccess] = useState(false);
  // data from successfully created plan
  const [planNameCreated, setPlanName] = useState('');
  const [perCycleCostCreated, setPerCycleCost] = useState('');
  const [billingFrequencyCreated, setBillingFrequency] = useState('');
  const [startDateCreated, setStartDateCreated] = useState('');
  const [planCode, setPlanCode] = useState('');

  const { onCopy: onCopyURL, setValue: setValueURL } = useClipboard('');
  const { onCopy: onCopyCode, setValue: setValueCode } = useClipboard('');

  useEffect(() => {
    setValueURL(`${process.env.HOST}/join/${planCode}`);
    setValueCode(planCode);
  }, [planCode]);

  const [createNewPlan, { data, loading, error }] = useMutation(CREATE_PLAN, {
    onCompleted: ({
      createPlan: {
        planId, planName, cycleFrequency, startDate: returnedStartDate, perCycleCost
      }
    }) => {
      const dateSplit = returnedStartDate.split('-');
      setPlanToJoin(planId);
      setPlanName(planName);
      setPerCycleCost(perCycleCost);
      setBillingFrequency(cycleFrequency[0].concat(cycleFrequency.slice(1).toLowerCase()));
      setStartDateCreated(`${dateSplit[1]}/${dateSplit[2]}/${dateSplit[0]}`);
      setPlanCode(planId);
      setSuccess(true);
    },
    onError: ({ message }) => {
      console.log('error creating plan: ', message);
      setSuccess(false);
    },
    refetchQueries: [{ query: GET_PLANS }, 'ViewAllPlans'],
  });

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

  const onCloseDrawer = () => {
    setSuccess(false);
    setPlanName('');
    setPerCycleCost('');
    setBillingFrequency('');
    setStartDateCreated('');
    setPlanCode('');
    setPlanToJoin(null);
    onClose();
  };

  return (
    <Drawer isOpen={isOpen} onClose={onCloseDrawer} placement="right" size={isMobile ? 'full' : 'md'}>
      <DrawerOverlay />
      <DrawerContent px={2} py={2}>
        <DrawerCloseButton />
        {/* create plan form vs success page */}
        {!success ? (
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
              <HStack width="100%" justify="space-between" pt={2}>
                <Button variant="outline" width="45%" onClick={onCloseDrawer}>Cancel</Button>
                <Button variant="solid" width="45%" type="submit" form="create-plan-form" isLoading={loading} disabled={loading}>Create Plan</Button>
              </HStack>
            </DrawerFooter>
          </>
        ) : (
          <>
            <DrawerHeader pt={4}>
              <Text color="#2B6CB0" fontSize="3xl">
                Success! Your plan was created
              </Text>
            </DrawerHeader>
            <DrawerBody>
              <Stack spacing="3">
                <Box>
                  Join the plan or invite your friends.
                </Box>
                <Center py={5}>
                  <TableContainer width="75%" bg="#F7FAFC" p={6} borderRadius={10}>
                    <Table variant="unstyled" size="sm">
                      <Tbody>
                        <Tr>
                          <Td fontWeight="bold" fontSize="md">Plan Name: </Td>
                          <Td fontSize="md">{planNameCreated}</Td>
                        </Tr>
                        <Tr>
                          <Td fontWeight="bold" fontSize="md">Per Cycle Cost: </Td>
                          <Td fontSize="md">{perCycleCostCreated}</Td>
                        </Tr>
                        <Tr>
                          <Td fontWeight="bold" fontSize="md">Billing Frequency: </Td>
                          <Td fontSize="md">{billingFrequencyCreated}</Td>
                        </Tr>
                        <Tr>
                          <Td fontWeight="bold" fontSize="md">Start Date: </Td>
                          <Td fontSize="md">{startDateCreated}</Td>
                        </Tr>
                      </Tbody>
                    </Table>
                  </TableContainer>
                </Center>
                <VStack w="100%" spacing={8}>
                  <Flex w="100%" justify="left">
                    <Flex w="75%" direction="column">
                      <Text as="h5" textStyle="formLabel" fontSize="md" mb={4}>Share Magic Link</Text>
                      <InputGroup>
                        <Input type="url" readOnly value={`${process.env.HOST}/join/${planCode}`} fontSize="14px" color="blackAlpha.800" />
                        <InputRightAddon
                          p={0}
                          children={<Button type="button" onClick={onCopyURL} variant="copyBtn">copy</Button>}
                        />
                      </InputGroup>
                    </Flex>
                  </Flex>
                  <Flex w="100%" justify="left">
                    <Flex w="75%" direction="column">
                      <Text as="h5" textStyle="formLabel" fontSize="md" mb={4}>Share Plan Code</Text>
                      <InputGroup>
                        <Input type="text" readOnly value={planCode} fontSize="14px" color="blackAlpha.800" />
                        <InputRightAddon
                          p={0}
                          children={<Button type="button" onClick={onCopyCode} variant="copyBtn">copy</Button>}
                        />
                      </InputGroup>
                    </Flex>
                  </Flex>
                </VStack>
              </Stack>
            </DrawerBody>
            <DrawerFooter borderTopWidth="1px">
              <HStack width="100%" justify="space-between" pt={2}>
                <Button variant="outline" width="45%" onClick={onCloseDrawer}>Close</Button>
                <Button variant="solid" width="45%" onClick={() => { navigate(`/join/${planCode}`); }}>Join Plan</Button>
              </HStack>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
