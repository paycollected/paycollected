import * as React from 'react';
import {
  Icon, IconButton, Table, Tbody, Td, Th, Thead, Tr,
} from '@chakra-ui/react';

function MoreOptionsIcon() {
  return (
    <Icon viewBox="0 0 16 16" color="black">
      <path
        fill="currentColor"
        d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"
      />
    </Icon>
  );
}

export default function PlansTable({ plans }) {
  return (
    <Table>
      <Thead>
        <Tr>
          <Th>Plan Name</Th>
          <Th>Owner</Th>
          <Th>Your Cost</Th>
          <Th>Next Billing Date</Th>
          <Th>Per Cycle Cost</Th>
          <Th>Billing Cycle</Th>
          <Th>Subscriptions</Th>
          <Th />
        </Tr>
      </Thead>
      <Tbody>
        {plans.map((plan) => {
          const {
            planId, name, owner, isOwner, nextBillDate, cycleFrequency, perCycleCost, quantity,
            selfCost,
          } = plan;
          return (
            <Tr key={planId}>
              <Td>{name}</Td>
              {isOwner && (<Td>You</Td>)}
              {!isOwner && (<Td>{`${owner.firstName} ${owner.lastName[0]}.`}</Td>)}
              <Td>{selfCost}</Td>
              <Td>{nextBillDate}</Td>{console.log(typeof nextBillDate)}
              <Td>{perCycleCost}</Td>
              <Td>{cycleFrequency.toLowerCase()}</Td>
              <Td>{quantity}</Td>
              <Td>
                <IconButton
                  icon={<MoreOptionsIcon fontSize="1.25rem" />}
                  variant="ghost"
                  aria-label="Plan's Options"
                />
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
}
