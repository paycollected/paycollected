import React from 'react';
import {
  Box, Button, ButtonGroup, Container, HStack, Stack, Text, useBreakpointValue, useColorModeValue,
} from '@chakra-ui/react';
import PlansTable from './PlansTable.jsx';


export default function PlansTableLayout({ total, plans, setPlanToView, setPlanToJoin }) {
  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    <Container pl="0" pr="8%" minWidth="100%">
      <Box
        bg="bg-surface"
        boxShadow={{ base: 'none', md: useColorModeValue('sm', 'sm-dark') }}
        borderRadius={useBreakpointValue({ base: 'none', md: 'lg' })}
      >
        <Stack spacing="5">
          <Box overflowX="auto">
            <PlansTable plans={plans} setPlanToView={setPlanToView} setPlanToJoin={setPlanToJoin} />
          </Box>
          <Box px={{ base: '4', md: '6' }} pb="5">
            <HStack spacing="3" justify="space-between">
              {!isMobile && (
                <Text color="muted" fontSize="sm">
                  {`Showing 1 to 5 of ${total} results`}
                </Text>
              )}
              <ButtonGroup
                spacing="3"
                justifyContent="space-between"
                width={{ base: 'full', md: 'auto' }}
                variant="secondary"
              >
                <Button>Previous</Button>
                <Button>Next</Button>
              </ButtonGroup>
            </HStack>
          </Box>
        </Stack>
      </Box>
    </Container>
  );
}
