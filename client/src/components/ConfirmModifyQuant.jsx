import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import {
  useDisclosure, Button,
  Modal, ModalOverlay, ModalContent, ModalCloseButton, ModalHeader, ModalBody, ModalFooter
} from '@chakra-ui/react';
import { EditQuantity as EDIT_QUANTITY } from '../graphql/mutations.gql';

const regex = /^[1-6]$/;

export default function ConfirmModifyQuant({
  plan, originalQuant, newQuantity
}) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { subscriptionId, activeMembers } = plan;
  const members = activeMembers.map((member) => (member.firstName));
  const membersStr = members.length > 1
    ? members.slice(0, -1).join(', ').concat(', and ', members[members.length - 1])
    : members[0];
  const [inputErr, setInputErr] = useState(null);

  useEffect(() => {
    setInputErr(null);
  }, [newQuantity]);

  const [confirmQuantChange, { data, loading, error }] = useMutation(EDIT_QUANTITY, {
    onCompleted: () => { onClose(); },
    update: (cache, { data: { editQuantity } }) => {
      const { planId, quantity: resultQuant } = editQuantity;
      cache.modify({
        id: `Plan:{"planId":"${planId}"}`,
        fields: {
          quantity() { return resultQuant; },
        }
      });
    },
  });

  const handleSubmit = () => {
    if (newQuantity === originalQuant.toString()) {
      setInputErr('Please submit a quantity different from your original.');
    } else if (!regex.test(newQuantity)) {
      setInputErr('Invalid input! Only 1 through 6 please.');
    } else {
      onOpen();
    }
  };

  const handleConfirmQuantChange = () => {
    confirmQuantChange({ variables: { subscriptionId, newQuantity: Number(newQuantity) } });
  };

  return (
    <div>
      <Button
        onClick={handleSubmit}
        disabled={!!inputErr}
      >
        Change quantity
      </Button>
      {inputErr && (<p>{inputErr}</p>)}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Modify Quantity of Plan:&nbsp;
            {plan.name}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {members.length > 0 && (<p>{`with ${membersStr}`}</p>)}
            <p>{`Current quantity: ${originalQuant}`}</p>
            <p>{`New quantity: ${newQuantity}`}</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button isLoading={loading} disabled={loading} onClick={handleConfirmQuantChange}>
              Update Quantity!
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
