import React, { useState } from 'react';
import {
  Icon, IconButton, Table, Tbody, Td, Th, Thead, Tr, Menu, MenuButton, MenuList, MenuItem, HStack,
  Badge, Text, useDisclosure,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import ActionConfirmationModal from '../../components/ActionConfirmationModal.jsx';
import MagicLinkModal from '../../components/MagicLinkModal.jsx';

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

export default function PlansTable({
  plans, setPlanToView, setPlanToJoin, successPlan
}) {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: mlIsOpen, onOpen: mlOnOpen, onClose: mlOnClose } = useDisclosure();
  const [planIdForAction, setPlanIdForAction] = useState(null);
  const [planNameForAction, setPlanNameForAction] = useState(null);

  return (
    <>
      <ActionConfirmationModal
        onClose={onClose}
        isOpen={isOpen}
        action="delete"
        planName={planNameForAction}
        planId={planIdForAction}
        subscriptionId={null}
        members={null}
        setPlanToView={setPlanToView}
        inDashboard
      />
      <MagicLinkModal
        onClose={mlOnClose}
        isOpen={mlIsOpen}
        planName={planNameForAction}
        planId={planIdForAction}
      />
      <Table size={{ base: 'sm', md: 'md' }}>
        <Thead bg="#F7FAFC">
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
          {plans.length === 0 && (
            <Tr><Td colSpan={7} textAlign="center">You are currently not enrolled in any plan.</Td></Tr>
          )}
          {plans.map((plan) => {
            const {
              planId, name, owner, isOwner, nextBillDate, cycleFrequency, perCycleCost, quantity,
              selfCost,
            } = plan;

            return (
              <Tr key={planId}>
                {(!successPlan || (successPlan && successPlan.planId !== planId)) && (
                  <Td>{name}</Td>
                )}
                {successPlan && successPlan.planId === planId && (
                  <Td>
                    <HStack spacing={4}>
                      <Text>{name}</Text>
                      <Badge variant="subtle" colorScheme="blue" fontSize="12px">NEW</Badge>
                    </HStack>
                  </Td>
                )}
                {isOwner && (<Td>You</Td>)}
                {!isOwner && (<Td>{owner.formattedName}</Td>)}
                <Td>{selfCost}</Td>
                <Td>{nextBillDate}</Td>
                <Td>{perCycleCost}</Td>
                <Td>{cycleFrequency}</Td>
                <Td>{quantity}</Td>
                <Td>
                  <Menu>
                    <MenuButton
                      as={IconButton}
                      aria-label="Options"
                      icon={<MoreOptionsIcon fontSize="1.25rem" bg="white" />}
                      variant="menuIcon"
                    />
                    <MenuList>
                      {isOwner && quantity === 0 && (
                        <MenuItem onClick={() => {
                          setPlanToJoin(planId);
                          navigate(`/join/${planId}`);
                        }}
                        >
                          Join Plan
                        </MenuItem>
                      )}
                      <MenuItem onClick={() => {
                        setPlanIdForAction(planId);
                        setPlanNameForAction(name);
                        mlOnOpen();
                      }}
                      >
                        Share Plan
                      </MenuItem>
                      <MenuItem
                        onClick={() => {
                          setPlanToView(planId);
                          navigate('/view');
                        }}
                      >
                        View Details
                      </MenuItem>
                      {isOwner && (
                        <>
                          <MenuItem
                            onClick={() => {
                              setPlanToView(planId);
                              navigate('/edit');
                            }}
                          >
                            Manage Plan
                          </MenuItem>
                          <MenuItem onClick={() => {
                            setPlanIdForAction(planId);
                            setPlanNameForAction(name);
                            onOpen();
                          }}
                          >
                            Delete Plan
                          </MenuItem>
                        </>
                      )}
                    </MenuList>
                  </Menu>
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </>
  );
}
