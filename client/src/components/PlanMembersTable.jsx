import React from 'react';
import {
  Table, Tbody, Td, Th, Thead, Tr, Container, Box, Badge,
} from '@chakra-ui/react';

export default function PlanMembersTable({ members }) {
  return (
    <Container minWidth="100%" padding={0}>
      <Box overflowX="auto" w={{ base: '70vw', md: '60%' }}>
        <Table size="sm" variant="unstyled">
          <Thead bg="gray.200" color="blackAlpha.700">
            <Tr>
              <Th textTransform="none" py={2}>Name</Th>
              <Th textTransform="none" py={2}>Subscriptions</Th>
              <Th textTransform="none" py={2}>Joined</Th>
            </Tr>
          </Thead>
          <Tbody bg="gray.50">
            {members.map((member, i) => (
              <Tr key={member.username}>
                <Td pt={i === 0 ? 4 : 2} pb={i === members.length - 1 ? 4 : 2}>
                  {member.fullName}
                  {member.isOwner && (
                    <Badge ml={1} variant="subtle" colorScheme="green" fontSize="0.5rem">owner</Badge>
                  )}
                </Td>
                <Td pt={i === 0 ? 4 : 2} pb={i === members.length - 1 ? 4 : 2}>
                  {member.quantity}
                </Td>
                <Td pt={i === 0 ? 4 : 2} pb={i === members.length - 1 ? 4 : 2}>
                  {member.joinedDate}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Container>
  );
}
