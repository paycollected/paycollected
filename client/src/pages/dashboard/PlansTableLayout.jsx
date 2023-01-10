import React from 'react';
import { NetworkStatus } from '@apollo/client';
import {
  Box, Button, Container, Stack, Center, useBreakpointValue, useColorModeValue, Tabs, TabList,
  Tab, Flex, Select, Text, Circle
} from '@chakra-ui/react';
import PlansTable from './PlansTable.jsx';


export default function PlansTableLayout({
  total, plans, setPlanToView, setPlanToJoin, successPlan, fetchMore, refetch, tabIndex,
  setTabIndex, networkStatus, setSuccessPlan, sortBy, setSortBy,
}) {
  const onTabChange = (index) => {
    switch (index) {
      case 2:
        setTabIndex(2);
        refetch({ filterByOwnership: true });
        break;
      default:
        setTabIndex(0);
        refetch({ filterByOwnership: false });
        break;
    }
  };

  return (
    <Container pl="0" pr="8%" minWidth="100%">
      <Box
        bg="bg-surface"
        boxShadow={{ base: 'none', md: useColorModeValue('sm', 'sm-dark') }}
        borderRadius={useBreakpointValue({ base: 'none', md: 'lg' })}
      >
        <Stack spacing={5}>
          <Flex justify="space-between" flexWrap="wrap">
            <Tabs variant="unstyled" onChange={onTabChange} defaultIndex={tabIndex}>
              <TabList>
                <Tab color="gray.600" _selected={{ color: 'blue.600', borderBottomColor: 'blue.600', borderBottomWidth: '2px' }}>
                  {tabIndex === 0 && networkStatus === NetworkStatus.ready && (
                    <Stack direction="row" spacing={2}>
                      <Flex align="center"><Text>Active</Text></Flex>
                      <Circle size="2rem" bg="blue.600" color="white">{total}</Circle>
                    </Stack>
                  )}
                  {!(tabIndex === 0 && networkStatus === NetworkStatus.ready) && (<>Active</>)}
                </Tab>
                <Tab isDisabled>Inactive</Tab>
                <Tab color="gray.600" _selected={{ color: 'blue.600', borderBottomColor: 'blue.600', borderBottomWidth: '2px' }}>
                  {tabIndex === 2 && networkStatus === NetworkStatus.ready && (
                    <Stack direction="row" spacing={2}>
                      <Flex align="center"><Text>Owned</Text></Flex>
                      <Circle size="2rem" bg="blue.600" color="white">{total}</Circle>
                    </Stack>
                  )}
                  {!(tabIndex === 2 && networkStatus === NetworkStatus.ready) && (<>Owned</>)}
                </Tab>
              </TabList>
            </Tabs>
            <Stack w="max-content" spacing={5} direction="row" mt={{ base: 4, md: 0 }}>
              <Flex w="max-content" align="center">
                <Text color="gray.600" fontSize="sm" whiteSpace="nowrap">Order by</Text>
              </Flex>
              <Flex align="center">
                <Select
                  defaultValue={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    refetch({ orderBy: e.target.value });
                  }}
                >
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
              setSuccessPlan={setSuccessPlan}
            />
          </Box>
          <Box px={{ base: '4', md: '6' }} pb={5}>
            {plans.length < total && (
              <Center>
                <Button variant="secondary" type="button" onClick={() => fetchMore({ variables: { offset: plans.length } })}>Show More Results</Button>
              </Center>
            )}
            {plans.length === total && total > 5 && (
              <Center>
                <Button variant="secondary" type="button" onClick={() => refetch()}>Collapse Results</Button>
              </Center>
            )}
            {plans.length === total && total <= 5 && (
              <Center>End of Results</Center>
            )}
          </Box>
        </Stack>
      </Box>
    </Container>
  );
}
