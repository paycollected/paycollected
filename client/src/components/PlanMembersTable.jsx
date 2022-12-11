import React from 'react';
import { Table, Tbody, Td, Th, Thead, Tr, Container, Box } from '@chakra-ui/react';

export default function PlanMembersTable() {
  return (
    <Container minWidth="100%" padding={0}>
      <Box overflowX="auto" w={{ base: '70vw', md: '60%' }}>
        <Table size="sm" variant="unstyled">
          <Thead bg="gray.200">
            <Tr>
              <Th textTransform="none" py={2}>Name</Th>
              <Th textTransform="none" py={2}>Subscriptions</Th>
              <Th textTransform="none" py={2}>Joined</Th>
            </Tr>
          </Thead>
          <Tbody bg="gray.50">
            <Tr>
              <Td pt={4} pb={2}>Jessica Chen</Td>
              <Td pt={4} pb={2}>2</Td>
              <Td pt={4} pb={2}>10/24/2022</Td>
            </Tr>
            <Tr>
              <Td py={2}>Random Name</Td>
              <Td py={2}>0</Td>
              <Td py={2}>10/02/2022</Td>
            </Tr>
            <Tr>
              <Td pt={2} pb={4}>Mai-Ly Nguyen</Td>
              <Td pt={2} pb={4}>1</Td>
              <Td pt={2} pb={4}>10/30/2022</Td>
            </Tr>
          </Tbody>
        </Table>
      </Box>
    </Container>
  );
}
