import React from 'react';
import { Grid, GridItem } from '@chakra-ui/react';
import PlanMembersTable from '../../components/PlanMembersTable.jsx';

export default function JoinPlanGrid({
  name, isOwner, owner, cycleFrequency, perCycleCost, startDate, members, currQuant, totalQuantity
}) {
  return (
    <Grid
      templateColumns={{ base: 'repeat(2, 1fr)', md: '2fr 3fr' }}
      templateRows="repeat(8, max-content)"
      columnGap={{ base: 4, md: 8 }}
      rowGap={4}
    >
      <GridItem>Plan Name:</GridItem>
      <GridItem>{name}</GridItem>
      <GridItem>Owner:</GridItem>
      <GridItem>{isOwner ? 'You' : owner.fullName}</GridItem>
      <GridItem>Per Cycle Cost:</GridItem>
      <GridItem>{perCycleCost}</GridItem>
      <GridItem>Billing Frequency:</GridItem>
      <GridItem>{cycleFrequency}</GridItem>
      <GridItem>Start Date:</GridItem>
      <GridItem>{startDate}</GridItem>
      <GridItem colSpan={2}>Others on this plan:</GridItem>
      <GridItem colSpan={2}>
        <PlanMembersTable members={members} width="100%" />
      </GridItem>
    </Grid>
  );
}