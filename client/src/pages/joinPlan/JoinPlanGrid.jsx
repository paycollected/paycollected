import React from 'react';
import { Grid, GridItem, Text, VStack } from '@chakra-ui/react';
import PlanMembersTable from '../../components/PlanMembersTable.jsx';
import JoinPlanInput from './JoinPlanInput.jsx';

export default function JoinPlanGrid({
  name, isOwner, owner, cycleFrequency, perCycleCost, startDate, members, currQuant, totalQuantity,
  register, errors, watchQuantityInput,
}) {
  return (
    <Grid
      templateColumns={{ base: 'repeat(2, 1fr)', md: '2fr 3fr' }}
      templateRows="repeat(8, max-content)"
      columnGap={{ base: 4, md: 8 }}
      rowGap={4}
    >
      <GridItem textStyle="gridTitle">Plan Name:</GridItem>
      <GridItem>{name}</GridItem>
      <GridItem textStyle="gridTitle">Owner:</GridItem>
      <GridItem>{isOwner ? 'You' : owner.fullName}</GridItem>
      <GridItem textStyle="gridTitle">Per Cycle Cost:</GridItem>
      <GridItem>{perCycleCost}</GridItem>
      <GridItem textStyle="gridTitle">Billing Frequency:</GridItem>
      <GridItem>{cycleFrequency}</GridItem>
      <GridItem textStyle="gridTitle">Start Date:</GridItem>
      <GridItem>{startDate}</GridItem>
      <GridItem colSpan={2}>
        <VStack spacing={8} pb={6}>
          <Text w="100%" textStyle="gridTitle">
            Others on this plan:
          </Text>
          <PlanMembersTable members={members} width="100%" />
        </VStack>
      </GridItem>
      <GridItem colSpan={2}>
        <JoinPlanInput
          totalQuantity={totalQuantity}
          perCycleCost={perCycleCost}
          cycleFrequency={cycleFrequency}
          register={register}
          errors={errors}
          watchQuantityInput={watchQuantityInput}
        />
      </GridItem>
    </Grid>
  );
}
