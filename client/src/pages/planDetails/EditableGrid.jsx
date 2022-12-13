import React, { useState } from 'react';
import {
  Button, FormControl, FormLabel, Input, VStack, Grid, GridItem, Text, HStack,
} from '@chakra-ui/react';
import { EditIcon } from '@chakra-ui/icons';
import PlanMembersTable from '../../components/PlanMembersTable.jsx';


export default function EditableGrid({
  name, fStartDate, isOwner, owner, cycleFrequency, perCycleCost, quantity, selfCost, totalMembers,
  totalQuantity, activeMembers, register, handleFormSubmit,
}) {
  const [editAsMember, setEditAsMember] = useState(false);

  return (
    <Grid
      templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }}
      templateRows={{ base: 'repeat(10, max-content)', md: 'repeat(6, max-content)' }}
      gap={4}
      mb={{ base: 6, md: 8 }}
    >
      <GridItem>
        <VStack justify="left" spacing={{ base: 1, md: 2 }}>
          <Text w="100%" textStyle="formLabel">Plan Name</Text>
          <Text w="100%" textStyle="formSavedInput">{name}</Text>
        </VStack>
      </GridItem>
      <GridItem>
        <VStack justify="left" spacing={{ base: 1, md: 2 }}>
          <Text w="100%" textStyle="formLabel">Start Date</Text>
          <Text w="100%" textStyle="formSavedInput">{fStartDate}</Text>
        </VStack>
      </GridItem>
      <GridItem colSpan={{ base: 1, md: 2 }}>
        <VStack justify="left" spacing={{ base: 1, md: 2 }}>
          <Text w="100%" textStyle="formLabel">Owner</Text>
          <Text w="100%" textStyle="formSavedInput">{isOwner ? 'You' : `${owner.firstName} ${owner.lastName}`}</Text>
        </VStack>
      </GridItem>
      <GridItem>
        <VStack justify="left" spacing={{ base: 1, md: 2 }}>
          <Text w="100%" textStyle="formLabel">Billing Frequency</Text>
          <Text w="100%" textStyle="formSavedInput">{cycleFrequency[0].concat(cycleFrequency.slice(1).toLowerCase())}</Text>
        </VStack>
      </GridItem>
      <GridItem>
        <VStack justify="left" spacing={{ base: 1, md: 2 }}>
          <Text w="100%" textStyle="formLabel">Total Cycle Cost</Text>
          <Text w="100%" textStyle="formSavedInput">{perCycleCost}</Text>
        </VStack>
      </GridItem>
      <GridItem>
        <VStack justify="left" spacing={{ base: 1, md: 2 }}>
          {(isOwner || (!isOwner && editAsMember)) && (
            <Text w="100%" textStyle="formLabel">Your Subscriptions</Text>
          )}
          {!isOwner && !editAsMember && (
            <HStack w="100%">
              <Text textStyle="formLabel">Your Subscriptions</Text>
              <Button variant="smEdit" onClick={() => setEditAsMember(true)}>
                <HStack color="blue.500">
                  <Text color="blue.500" fontSize="sm">Edit</Text>
                  <EditIcon boxSize={3} />
                </HStack>
              </Button>
            </HStack>
          )}
          {(isOwner || (!isOwner && !editAsMember)) && (
            <Text w="100%" textStyle="formSavedInput">{quantity}</Text>
          )}
          {!isOwner && editAsMember && (
            <HStack w="100%">
              <Text textStyle="formSavedInput">{quantity}</Text>
              <Button size="sm" onClick={() => setEditAsMember(false)}>Save</Button>
            </HStack>
          )}
        </VStack>
      </GridItem>
      <GridItem>
        <VStack justify="left" spacing={{ base: 1, md: 2 }}>
          <Text w="100%" textStyle="formLabel">Your Cycle Cost</Text>
          <Text w="100%" textStyle="formSavedInput">{selfCost}</Text>
        </VStack>
      </GridItem>
      <GridItem>
        <VStack justify="left" spacing={{ base: 1, md: 2 }}>
          <Text w="100%" textStyle="formLabel">Total Members</Text>
          <Text w="100%" textStyle="formSavedInput">{totalMembers}</Text>
        </VStack>
      </GridItem>
      <GridItem>
        <VStack justify="left" spacing={{ base: 1, md: 2 }}>
          <Text w="100%" textStyle="formLabel">Total Subscriptions</Text>
          <Text w="100%" textStyle="formSavedInput">{totalQuantity}</Text>
        </VStack>
      </GridItem>
      <GridItem colSpan={{ base: 1, md: 2 }}>
        <VStack justify="left" spacing={{ base: 4, md: 6 }}>
          <Text w="100%" textStyle="formLabel">Others on this plan</Text>
          <PlanMembersTable members={activeMembers} />
        </VStack>
      </GridItem>
    </Grid>
  );
}
