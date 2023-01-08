import React from 'react';
import {
  Box, Button, Container, Stack, Center, useBreakpointValue, useColorModeValue, Tabs, TabList,
  Tab, Flex, Select, Text,
} from '@chakra-ui/react';
import PlansTable from './PlansTable.jsx';


export default function PlansTableLayout({
  total, plans, setPlanToView, setPlanToJoin, successPlan, fetchMore, refetch,
}) {
  return (
    <Container pl="0" pr="8%" minWidth="100%">
      <Box
        bg="bg-surface"
        boxShadow={{ base: 'none', md: useColorModeValue('sm', 'sm-dark') }}
        borderRadius={useBreakpointValue({ base: 'none', md: 'lg' })}
      >
        <Stack spacing={5}>
          <Flex justify="space-between">
            <Tabs variant="unstyled">
              <TabList>
                <Tab color="gray.600" _selected={{ color: 'blue.600', borderBottomColor: 'blue.600', borderBottomWidth: '2px' }}>Active</Tab>
                <Tab isDisabled>Inactive</Tab>
                <Tab color="gray.600" _selected={{ color: 'blue.600', borderBottomColor: 'blue.600', borderBottomWidth: '2px' }}>Owned</Tab>
              </TabList>
            </Tabs>
            <Stack w="max-content" spacing={3} direction="row">
              <Flex w="max-content" align="center">
                <Text color="gray.600" fontSize="sm" whiteSpace="nowrap">Order by</Text>
              </Flex>
              <Flex align="center">
                <Select onChange={(e) => refetch({ orderBy: e.target.value })}>
                  <option value="PLAN_NAME">Name (A-Z)</option>
                  <option value="SELF_COST">Your Cost (lowest - highest)</option>
                  <option value="NEXT_BILL_DATE">Next Charge Date (least - most distant)</option>
                </Select>
              </Flex>
            </Stack>
          </Flex>
          <Box overflowX="auto">
            <PlansTable
              plans={plans}
              setPlanToView={setPlanToView}
              setPlanToJoin={setPlanToJoin}
              successPlan={successPlan}
            />
          </Box>
          <Box px={{ base: '4', md: '6' }} pb={5}>
            {plans.length < total && (
              <Center>
                <Button variant="secondary" type="button" onClick={() => fetchMore({ variables: { offset: plans.length } })}>Show More Results</Button>
              </Center>
            )}
            {plans.length === total && (
              <Center>
                <Button variant="secondary" type="button" onClick={() => refetch()}>Collapse Results</Button>
              </Center>
            )}
          </Box>
        </Stack>
      </Box>
    </Container>
  );
}
