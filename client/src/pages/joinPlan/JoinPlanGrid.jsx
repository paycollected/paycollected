import React from 'react';
import { Grid, GridItem } from '@chakra-ui/react';

export default function JoinPlanGrid({

}) {
  return (
    <Grid templateColumns="2fr 3fr" templateRows="repeat(8, max-content)" gap={4}>
      <GridItem>Plan Name:</GridItem>
      <GridItem>Poke Bowls</GridItem>
      <GridItem>Owner:</GridItem>
      <GridItem>Jessica Chen</GridItem>
      <GridItem>Per Cycle Cost:</GridItem>
      <GridItem>$100</GridItem>
      <GridItem>Billing Frequency:</GridItem>
      <GridItem>Weekly</GridItem>
      <GridItem>Start Date:</GridItem>
      <GridItem>12/30/2022</GridItem>
    </Grid>
  );
}