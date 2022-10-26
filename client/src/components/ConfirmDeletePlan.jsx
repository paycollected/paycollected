import React from 'react';
import { useMutation } from '@apollo/client';
import {
  useDisclosure, Button,
  Modal, ModalOverlay, ModalContent, ModalCloseButton, ModalHeader, ModalBody, ModalFooter
} from '@chakra-ui/react';
import { DeletePlan as DELETE_PLAN } from '../graphql/mutations.gql';
import { ViewAllPlans as GET_ALL_PLANS } from '../graphql/queries.gql';

export default function ConfirmDeletePlan({ plan }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { planId, activeMembers } = plan;
  const members = activeMembers.map((member) => (member.firstName));
  const membersStr = members.length > 1
    ? members.slice(0, -1).join(', ').concat(', and ', members[members.length - 1])
    : members[0];

  const [confirmDelete, { data, loading, error }] = useMutation(DELETE_PLAN, {
    onCompleted: () => { onClose(); },
    update: (cache, { data: { deletePlan } }) => {
      const { planId: resultPlanId } = deletePlan;
      cache.modify({
        fields: {
          viewAllPlans(allPlanRefs, { readField }) {
            return allPlanRefs.filter((planRef) => resultPlanId !== readField('planId', planRef));
          }
        }
      });
    },
  });

  const handleConfirmDelete = () => {
    confirmDelete({ variables: { planId } });
  };

  return (
    <div>
      <Button onClick={onOpen}>Delete Plan</Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Delete Plan:&nbsp;
            {plan.name}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {members.length > 0 && (<p>{`with ${membersStr}`}</p>)}
            <p>{`Total Quantity: ${plan.quantity}`}</p>
            <p>Are you sure you want to delete this plan?</p>
            <p>This action cannot be reversed and will make the plan unavailable to all current, active members on the plan.</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={onClose}>
              Back
            </Button>
            <Button onClick={handleConfirmDelete}>
              Confirm Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
