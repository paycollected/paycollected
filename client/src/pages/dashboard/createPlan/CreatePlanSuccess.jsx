import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  InputGroup, Box, Stack, Button, Input, HStack, DrawerHeader, DrawerBody, DrawerFooter,
  VStack, Flex, InputRightAddon, Text, Center, Grid, GridItem,
} from '@chakra-ui/react';

export default function CreatePlanSuccess({
  planNameCreated, perCycleCostCreated, billingFrequencyCreated, startDateCreated, planCode,
  onCloseDrawer, onCopyURL, onCopyCode,
}) {
  const navigate = useNavigate();

  return (
    <>
      <DrawerHeader pt={4} pb={0}>
        <Text color="#2B6CB0" fontSize="3xl">
          Success! Your plan was created
        </Text>
      </DrawerHeader>
      <DrawerBody>
        <Stack spacing="3">
          <Box>
            Join the plan or invite your friends.
          </Box>
          <Center py={5} w="100%">
            <Grid
              w="85%"
              p={8}
              bg="#F7FAFC"
              borderRadius={10}
              templateColumns="3fr 2fr"
              templateRows="repeat(4, max-content)"
              rowGap={2}
            >
              <GridItem fontWeight="bold" fontSize="md">Plan Name:</GridItem>
              <GridItem fontSize="md">{planNameCreated}</GridItem>
              <GridItem fontWeight="bold" fontSize="md">Per Cycle Cost: </GridItem>
              <GridItem fontSize="md">{perCycleCostCreated}</GridItem>
              <GridItem fontWeight="bold" fontSize="md">Billing Frequency: </GridItem>
              <GridItem fontSize="md">{billingFrequencyCreated}</GridItem>
              <GridItem fontWeight="bold" fontSize="md">Start Date: </GridItem>
              <GridItem fontSize="md">{startDateCreated}</GridItem>
            </Grid>
          </Center>
          <VStack w="100%" spacing={8}>
            <Flex w="100%" justify="left">
              <Flex w="75%" direction="column">
                <Text as="h5" textStyle="formLabel" fontSize="md" mb={4}>Share Magic Link</Text>
                <InputGroup>
                  <Input type="url" readOnly value={`${process.env.HOST}/join/${planCode}`} fontSize="14px" color="blackAlpha.800" />
                  <InputRightAddon
                    p={0}
                    children={<Button type="button" onClick={onCopyURL} variant="copyBtn">copy</Button>}
                  />
                </InputGroup>
              </Flex>
            </Flex>
            <Flex w="100%" justify="left">
              <Flex w="75%" direction="column">
                <Text as="h5" textStyle="formLabel" fontSize="md" mb={4}>Share Plan Code</Text>
                <InputGroup>
                  <Input type="text" readOnly value={planCode} fontSize="14px" color="blackAlpha.800" />
                  <InputRightAddon
                    p={0}
                    children={<Button type="button" onClick={onCopyCode} variant="copyBtn">copy</Button>}
                  />
                </InputGroup>
              </Flex>
            </Flex>
          </VStack>
        </Stack>
      </DrawerBody>
      <DrawerFooter borderTopWidth="1px">
        <HStack width="100%" justify="space-between" pt={2}>
          <Button variant="outline" width="45%" onClick={onCloseDrawer}>Close</Button>
          <Button variant="solid" width="45%" onClick={() => { navigate(`/join/${planCode}`); }}>Join Plan</Button>
        </HStack>
      </DrawerFooter>
    </>
  );
}
