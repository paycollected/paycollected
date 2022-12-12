import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import {
  Button, Modal, ModalOverlay, ModalContent, ModalCloseButton, ModalHeader, ModalBody, ModalFooter,
  Text, HStack, VStack, Flex, FormControl, FormLabel, FormErrorMessage, Select,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import {
  Unsubscribe as UNSUBSCRIBE,
  UnsubscribeAsPlanOwner as UNSUBSCRIBE_AS_OWNER,
  DeletePlan as DELETE_PLAN,
} from '../../graphql/mutations.gql';

export default function ActionConfirmationModal({
  action, isOpen, onClose, subscriptionId, planId, planName, members, setPlanToView,
}) {
  const [newOwner, setNewOwner] = useState(members[0].username);
  const [selectError, setSelectError] = useState('');
  const navigate = useNavigate();
  const requestCompleted = () => {
    setPlanToView(null);
    onClose();
    navigate('/dashboard');
  };

  const [confirmUnsubscribe, { data, loading, error }] = useMutation(UNSUBSCRIBE, {
    onCompleted: requestCompleted,
  });

  const [
    confirmUnsubscribeAsOwner,
    { data: ownerData, loading: ownerLoading, error: ownerError}
  ] = useMutation(UNSUBSCRIBE_AS_OWNER, {
    onCompleted: requestCompleted,
  });

  const [confirmDelete, {
    data: deleteData, loading: deleteLoading, error: deleteError
  }] = useMutation(DELETE_PLAN, {
    onCompleted: requestCompleted,
  });

  const handleConfirmation = () => {
    switch (action) {
      case 'delete':
        confirmDelete({ variables: { planId } });
        break;
      case 'cancel':
        confirmUnsubscribe({ variables: { subscriptionId } });
        break;
      case 'cancelAsOwner':
        if (members.filter((member) => member.username === newOwner).length > 0) {
          confirmUnsubscribeAsOwner({ variables: { subscriptionId, newOwner } });
        } else {
          setSelectError("Input doesn't reflect an existing member of plan.");
        }
        break;
      default:
        break;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        {(action === 'cancel' || action === 'cancelAsOwner') && (
          <ModalHeader>Cancel Your Subscription</ModalHeader>
        )}
        {action === 'delete' && (
          <ModalHeader>{`Delete Plan ${planName}`}</ModalHeader>
        )}
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6}>
            {(action === 'cancel' || action === 'cancelAsOwner') && (
              <Text>You are about to discontinue your membership on this plan. Are you sure you would like to proceed?</Text>
            )}
            {action === 'delete' && (
              <>
                <Flex w="100%" justify="start">
                  <Text>You are about to delete this plan.</Text>
                </Flex>
                <Text>
                  This action cannot be reversed and will make the plan unavailable to all current members.
                  Are you sure you would like to proceed?
                </Text>
              </>
            )}
            {action === 'cancelAsOwner' && (
              <FormControl isRequired>
                <FormLabel>Change plan&apos;s owner:</FormLabel>
                <Select value={newOwner} onChange={(e) => setNewOwner(e.target.value)}>
                  {members.map((member) => (
                    <option key={member.username} value={member.username}>{`${member.firstName} ${member.lastName}`}</option>
                  ))}
                </Select>
                {selectError && (<FormErrorMessage>{selectError}</FormErrorMessage>)}
              </FormControl>
            )}
            <Text textStyle="note">
              Once your request has been successfully processed, you will be redirected to the Dashboard.
            </Text>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <HStack spacing={4}>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleConfirmation}>Continue</Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
