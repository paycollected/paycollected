import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import {
  useDisclosure, Button, RadioGroup, Stack, Radio,
  Modal, ModalOverlay, ModalContent, ModalCloseButton, ModalHeader, ModalBody, ModalFooter
} from '@chakra-ui/react';
import {
  Unsubscribe as UNSUBSCRIBE,
  UnsubscribeAsPlanOwner as UNSUBSCRIBE_AS_OWNER
} from '../graphql/mutations.gql';

export default function ConfirmCancel({ plan, user }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    subscriptionId, planId, activeMembers, owner
  } = plan;
  const [newOwner, setNewOwner] = useState(
    activeMembers.length > 0 ? activeMembers[0].username : null
  );
  const members = activeMembers.map((member) => (member.firstName));
  const membersStr = members.length > 1
    ? members.slice(0, -1).join(', ').concat(', and ', members[members.length - 1])
    : members[0];

  const [confirmUnsubscribe, { data, loading, error }] = useMutation(UNSUBSCRIBE, {
    onCompleted: () => { onClose(); },
    // update: (cache, { data: { unsubscribe } }) => {
    //   const { planId: resultPlanId } = unsubscribe;
    //   cache.modify({
    //     fields: {
    //       viewAllPlans(allPlanRefs, { readField }) {
    //         return allPlanRefs.filter((planRef) => resultPlanId !== readField('planId', planRef));
    //       }
    //     }
    //   });
    // },
  });

  const [
    confirmUnsubscribeAsOwner,
    { data: ownerData, loading: ownerLoading, error: ownerError}
  ] = useMutation(UNSUBSCRIBE_AS_OWNER, {
    onCompleted: () => { onClose(); },
    // update: (cache, { data: { unsubscribeAsOwner } }) => {
    //   const { planId: resultPlanId } = unsubscribeAsOwner;
    //   cache.modify({
    //     fields: {
    //       viewAllPlans(allPlanRefs, { readField }) {
    //         return allPlanRefs.filter((planRef) => resultPlanId !== readField('planId', planRef));
    //       }
    //     }
    //   });
    // },
  });

  const handleConfirmUnsubscribe = () => {
    if (owner.username !== user) {
      confirmUnsubscribe({ variables: { subscriptionId } });
    } else {
      confirmUnsubscribeAsOwner({
        variables: {
          subscriptionId, planId, newOwner
        }
      });
    }
  };

  return (
    <div>
      <Button onClick={onOpen}>Cancel Subscription</Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Cancel Plan:&nbsp;
            {plan.name}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {members.length > 0 && (<p>{`with ${membersStr}`}</p>)}
            <p>{`Total Quantity: ${plan.quantity}`}</p>
            <p>Are you sure you want to drop out of this plan?</p>
            {owner.username === user && (
              <div>
                <p>Please transfer plan ownership to another member to proceed:</p>
                <RadioGroup onChange={setNewOwner} value={newOwner}>
                  <Stack>
                    {activeMembers.map((member) => (
                      <Radio
                        key={member.username}
                        value={member.username}
                      >
                        {member.firstName}
                      </Radio>
                    ))}
                  </Stack>
                </RadioGroup>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={onClose}>
              Back
            </Button>
            <Button onClick={handleConfirmUnsubscribe}>
              Confirm Cancellation
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
/*
<ConfirmModifyQuant plan={planToModify} newQuantity={newQuant} />
*/