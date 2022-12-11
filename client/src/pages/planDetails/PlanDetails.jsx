import React from 'react';
import {
  Button, FormControl, FormLabel, Input, Heading, VStack, WrapItem, Wrap, Box,
  Card, CardHeader, CardBody, Grid, GridItem, Text,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../../components/NavBar.jsx';


export default function PlanDetails({ user, setUser, setPlanToJoin }) {
  const navigate = useNavigate();
  return (
    <>
      <NavBar user={user} setUser={setUser} setPlanToJoin={setPlanToJoin} />
      <VStack w="93%" justify="left" spacing={{ base: '6', md: '8' }} mb="10">
        <Box w="100%">
          <Button
            variant="navActionBtn"
            justifySelf="left"
            onClick={() => { navigate('/dashboard'); }}
          >
            Back to Dashboard
          </Button>
        </Box>
        <Box w="100%" h="max-content">
          <Heading as="h1" variant="accented">Poke Bowls</Heading>
        </Box>
        <Box w="100%">
          <Card w={{ base: '95%', lg: '80%' }}>
            <CardHeader mx="6" mt="8" mb="0">
              <Heading as="h2" variant="nuanced">
                Plan Details
              </Heading>
            </CardHeader>
            <CardBody mx="6" mb="8" mt="0">
              <Grid
                templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }}
                templateRows={{ base: 'repeat(9, max-content)', md: 'repeat(5, max-content)' }}
                gap="8"
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
