import React from 'react';
import {
  Button, FormControl, FormLabel, Input, Heading, VStack, WrapItem, Wrap, Box,
  Card, CardHeader, CardBody, Grid, GridItem,
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
            <CardBody mx="6" mb="8" mt="0">Random body text</CardBody>
          </Card>
        </Box>
      </VStack>
    </>
  );
}
