import React from 'react';
import {
  Button, FormControl, FormLabel, Input, Heading, VStack, WrapItem, Wrap, Box, Flex,
  Card, CardHeader, CardBody, Grid, GridItem, Text, useBreakpointValue, Container,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../../components/NavBar.jsx';


export default function PlanDetails({ user, setUser, setPlanToJoin }) {
  const navigate = useNavigate();
  const isMobile = useBreakpointValue({ base: true, sm: false });

  return (
    <>
      <NavBar user={user} setUser={setUser} setPlanToJoin={setPlanToJoin} />
      <VStack w="93%" justify="left" spacing={{ base: '4', md: '6' }} mb={{ base: '4', md: '6' }}>
        <Flex w="100%" align="center">
          <Button
            variant="navActionBtn"
            onClick={() => { navigate('/dashboard'); }}
            h="max-content"
          >
            Back to Dashboard
          </Button>
        </Flex>
        <Flex w="100%" align="center">
          <Heading as="h1" variant="accented">Poke Bowls</Heading>
        </Flex>
        <Box w="100%">
          <Card w={{ base: '95%', lg: '80%' }}>
            <CardHeader mx="6" mt="8" mb="0">
              <Heading as="h2" variant="nuanced">
                Plan Details
              </Heading>
            </CardHeader>
            <CardBody mx="6" mb="8" mt="0">
              <Grid
                templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)' }}
                templateRows={{ base: 'repeat(9, max-content)', sm: 'repeat(5, max-content)' }}
                gap="6"
              >
                <GridItem>
                  <Text textStyle="formLabel">Plan Name</Text>
                  <Text textStyle="formSavedInput">Poke Bowls</Text>
                </GridItem>
                <GridItem>
                  <Text textStyle="formLabel">Start Date</Text>
                  <Text textStyle="formSavedInput">12/30/2022</Text>
                </GridItem>
                <GridItem>
                  <Text textStyle="formLabel">Owner</Text>
                  <Text textStyle="formSavedInput">You</Text>
                </GridItem>
                {!isMobile && (
                  <GridItem />
                )}
                <GridItem>
                  <Text textStyle="formLabel">Billing Frequency</Text>
                  <Text textStyle="formSavedInput">Weekly</Text>
                </GridItem>
                <GridItem>
                  <Text textStyle="formLabel">Total Cycle Cost</Text>
                  <Text textStyle="formSavedInput">$100.00</Text>
                </GridItem>
                <GridItem>
                  <Text textStyle="formLabel">Your Subscriptions</Text>
                  <Text textStyle="formSavedInput">2</Text>
                </GridItem>
                <GridItem>
                  <Text textStyle="formLabel">Your Cycle Cost</Text>
                  <Text textStyle="formSavedInput">$20.00</Text>
                </GridItem>
                <GridItem>
                  <Text textStyle="formLabel">Total Members</Text>
                  <Text textStyle="formSavedInput">3</Text>
                </GridItem>
                <GridItem>
                  <Text textStyle="formLabel">Total Subscriptions</Text>
                  <Text textStyle="formSavedInput">6</Text>
                </GridItem>
              </Grid>
            </CardBody>
          </Card>
        </Box>
      </VStack>
    </>
  );
}
