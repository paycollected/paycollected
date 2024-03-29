import React from 'react';
import {
  Button, VStack, Grid, GridItem, Text, HStack, NumberInput, Select, NumberInputField,
  NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper, Flex,
} from '@chakra-ui/react';
import { EditIcon } from '@chakra-ui/icons';
import PlanMembersTable from '../../components/PlanMembersTable.jsx';


export default function EditableGrid({
  name, startDate, isOwner, owner, cycleFrequency, perCycleCost, quantity, selfCost, totalMembers,
  totalQuantity, activeMembers, register, handleFormSubmit, handleSubmit, editAsMember,
  setEditAsMember, editAsOwner, user,
}) {
  return (
    <Grid
      templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }}
      templateRows={{ base: 'repeat(10, max-content)', md: 'repeat(6, max-content)' }}
      gap={8}
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
          <Text w="100%" textStyle="formSavedInput">{startDate}</Text>
        </VStack>
      </GridItem>
      <GridItem colSpan={{ base: 1, md: 2 }}>
        <Grid templateColumns="repeat(2, 1fr)">
          <GridItem>
            <VStack w="100%" spacing={{ base: 1, md: 2 }}>
              <Text w="100%" textStyle="formLabel">Owner</Text>
              {isOwner && editAsOwner && (
                <Flex w="100%" justify="start">
                  <Select
                    w="80%"
                    justifySelf="left"
                    {...register('newOwner', {
                      validate: (username) => (activeMembers.filter((member) => member.username === username).length === 1 || username === user) || 'Invalid new owner',
                    })}
                  >
                    <option key={user} value={user}>You</option>
                    {activeMembers.map((member) => (
                      <option key={member.username} value={member.username}>{`${member.firstName} ${member.lastName}`}</option>
                    ))}
                  </Select>
                </Flex>
              )}
              {!(isOwner && editAsOwner) && (
                <Text w="100%" textStyle="formSavedInput">{isOwner ? 'You' : owner.fullName}</Text>
              )}
            </VStack>
          </GridItem>
          <GridItem />
        </Grid>
      </GridItem>
      <GridItem>
        <VStack justify="left" spacing={{ base: 1, md: 2 }}>
          <Text w="100%" textStyle="formLabel">Billing Frequency</Text>
          <Text w="100%" textStyle="formSavedInput">{cycleFrequency}</Text>
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
              <Button type="button" variant="smEdit" onClick={() => setEditAsMember(true)}>
                <HStack color="blue.500">
                  <Text color="blue.500" fontSize="sm">Edit</Text>
                  <EditIcon boxSize={3} />
                </HStack>
              </Button>
            </HStack>
          )}
          {((isOwner && !editAsOwner)
          || (!isOwner && !editAsMember)
          || (isOwner && editAsOwner && quantity === 0)) && (
            <Text w="100%" textStyle="formSavedInput">{quantity}</Text>
          )}
          {isOwner && editAsOwner && quantity > 0 && (
            <Flex w="100%" justify="start">
              <NumberInput w={{ base: '40%', md: '85%' }}>
                <NumberInputField
                  min={1}
                  {...register('newQuantity', {
                    min: 1,
                    value: quantity,
                    valueAsNumber: true,
                  })}
                />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </Flex>
          )}
          {!isOwner && (
            <form style={{ width: '100%' }} onSubmit={handleSubmit(handleFormSubmit)}>
              {editAsMember && (
                <HStack w="100%" spacing={6}>
                  <NumberInput>
                    <NumberInputField
                      min={1}
                      {...register('newQuantity', {
                        min: 1,
                        value: quantity,
                        valueAsNumber: true,
                      })}
                    />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <Button type="submit" size="sm">Save</Button>
                </HStack>
              )}
            </form>
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
          <PlanMembersTable members={activeMembers} width="60%" />
        </VStack>
      </GridItem>
    </Grid>
  );
}
