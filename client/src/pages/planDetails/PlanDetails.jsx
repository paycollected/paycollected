import React, { useState } from 'react';
import {
  Button, FormControl, FormLabel, Input, Heading, VStack, Box, Flex,
  Card, CardHeader, CardBody, Grid, GridItem, Text, HStack, IconButton,
} from '@chakra-ui/react';
import { EditIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import NavBar from '../../components/NavBar.jsx';
import PlanMembersTable from '../../components/PlanMembersTable.jsx';
import { PlanDetails as GET_PLAN } from '../../graphql/queries.gql';


export default function PlanDetails({
  user, setUser, setPlanToJoin, planToView, setPlanToView, edit,
}) {
  const navigate = useNavigate();
  const { loading, data, error } = useQuery(GET_PLAN, {
    variables: { planId: planToView },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-only',
  });
  const [editAsOwner, setEditAsOwner] = useState(edit);
  const [editAsMember, setEditAsMember] = useState(false);

  if (data) {
    const {
      viewOnePlan: {
        planId, name, cycleFrequency, perCycleCost, startDate, owner, isOwner, quantity, selfCost,
        totalMembers, totalQuantity, subscriptionId, activeMembers,
      }
    } = data;
    const startDateAsArr = startDate.split('-');
    const fStartDate = `${startDateAsArr[1]}/${startDateAsArr[2]}/${startDateAsArr[0]}`;
    return (
      <>
        <NavBar user={user} setUser={setUser} setPlanToJoin={setPlanToJoin} />
        <VStack w="93%" justify="left" spacing={{ base: 4, md: 6 }} mb={{ base: 4, md: 6 }}>
          <Flex w="100%" align="center">
            <Button
              variant="navActionBtn"
              onClick={() => {
                setPlanToView(null);
                navigate('/dashboard');
              }}
              h="max-content"
            >
              Back to Dashboard
            </Button>
          </Flex>
          <Box w="100%">
            <Flex w={{ base: '95%', lg: '80%' }} align="center" justify="space-between" mb={6}>
              <Heading as="h1" variant="accented" pb={0}>{name}</Heading>
              <Button>Share Plan</Button>
            </Flex>
            <Card w={{ base: '95%', lg: '80%' }}>
              <CardHeader mx={6} mt={8} pb={0}>
                {!isOwner && (
                  <Heading as="h2" variant="nuanced">
                    Plan Details
                  </Heading>
                )}
                {isOwner && (
                  <Flex justify="space-between">
                    <Heading as="h2" variant="nuanced">
                      Plan Details
                    </Heading>
                    {!editAsOwner && (
                      <Button size="sm" onClick={() => setEditAsOwner(true)}>Edit Plan</Button>
                    )}
                    {editAsOwner && (
                      <HStack>
                        <Button size="sm" variant="outlineNuanced" onClick={() => setEditAsOwner(false)}>Cancel</Button>
                        <Button size="sm" onClick={() => setEditAsOwner(false)}>Save</Button>
                      </HStack>
                    )}
                  </Flex>
                )}
              </CardHeader>
              <CardBody mx={6} mb={8} mt={0}>
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
                {isOwner && (
                  <VStack justify="left">
                    <Box w="100%">
                      <Button variant="navActionBtn">Cancel your subscription</Button>
                    </Box>
                    <Box w="100%">
                      <Button variant="navActionBtn">Delete this plan</Button>
                    </Box>
                  </VStack>
                )}
                {!isOwner && (
                  <Box w="100%">
                    <Button variant="navActionBtn">Cancel your subscription</Button>
                  </Box>
                )}
              </CardBody>
            </Card>
          </Box>
        </VStack>
      </>
    );
  }
  return null;
}
