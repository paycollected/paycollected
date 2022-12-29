import React from 'react';
import { Grid, GridItem } from '@chakra-ui/react';
import PlanMembersTable from '../../components/PlanMembersTable.jsx';
import JoinPlanInput from './JoinPlanInput.jsx';

export default function JoinPlanGrid({
  name, isOwner, owner, cycleFrequency, perCycleCost, startDate, members, currQuant, totalQuantity,
  setStripeClientSecret, setSetupIntentId, setPaymentMethods, planId,
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
      <GridItem colSpan={2} textStyle="gridTitle">Others on this plan:</GridItem>
      <GridItem colSpan={2}>
        <PlanMembersTable members={members} width="100%" />
      </GridItem>
      <GridItem colSpan={2}>
        <JoinPlanInput
          setStripeClientSecret={setStripeClientSecret}
          setSetupIntentId={setSetupIntentId}
          setPaymentMethods={setPaymentMethods}
          totalQuantity={totalQuantity}
          perCycleCost={perCycleCost}
          cycleFrequency={cycleFrequency}
          planId={planId}
        />
      </GridItem>
    </Grid>
  );
}