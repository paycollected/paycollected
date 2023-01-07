import React from 'react';
import {
  Box, Button, Container, Stack, Center, useBreakpointValue, useColorModeValue,
} from '@chakra-ui/react';
import PlansTable from './PlansTable.jsx';


export default function PlansTableLayout({
  total, plans, setPlanToView, setPlanToJoin, successPlan, fetchMore, refetch,
}) {
  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    <Container pl="0" pr="8%" minWidth="100%">
      <Box
        bg="bg-surface"
        boxShadow={{ base: 'none', md: useColorModeValue('sm', 'sm-dark') }}
        borderRadius={useBreakpointValue({ base: 'none', md: 'lg' })}
      >
        <Stack spacing={5}>
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
                <Button variant="secondary" type="button" onClick={() => refetch({ variables: { limit: 5 } })}>Collapse Results</Button>
              </Center>
            )}
          </Box>
        </Stack>
      </Box>
    </Container>
  );
}
