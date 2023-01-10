import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import {
  Button, Modal, ModalOverlay, ModalContent, ModalCloseButton, ModalHeader, ModalBody, ModalFooter,
  Text, HStack, VStack, Flex, FormControl, FormLabel, FormErrorMessage, Select, Heading,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import {
  Unsubscribe as UNSUBSCRIBE,
  UnsubscribeAsPlanOwner as UNSUBSCRIBE_AS_OWNER,
  DeletePlan as DELETE_PLAN,
} from '../graphql/mutations.gql';
import { ViewAllPlans as GET_PLANS } from '../graphql/queries.gql';


export default function ActionConfirmationModal({
  action, isOpen, onClose, subscriptionId, planId, planName, members, setPlanToView, inDashboard,
  successPlan, setSuccessPlan,
}) {
  const [newOwner, setNewOwner] = useState(
    (members === null || members.length === 0)
      ? null : members[0].username
  );
  const [selectError, setSelectError] = useState('');
  const navigate = useNavigate();
  const requestCompleted = () => {
    setPlanToView(null);
    if (successPlan && planName === successPlan) {
      setSuccessPlan(null);
    }
    onClose();
    if (!inDashboard) navigate('/dashboard');
  };

  const [confirmUnsubscribe, { data, loading, error }] = useMutation(UNSUBSCRIBE, {
    onCompleted: requestCompleted,
  });

  const [
    confirmUnsubscribeAsOwner,
    { data: ownerData, loading: ownerLoading, error: ownerError }
  ] = useMutation(UNSUBSCRIBE_AS_OWNER, {
    onCompleted: requestCompleted,
  });

  const [confirmDelete, {
    data: deleteData, loading: deleteLoading, error: deleteError
  }] = useMutation(DELETE_PLAN, {
    onCompleted: requestCompleted,
    refetchQueries: [{ query: GET_PLANS }, 'ViewAllPlans'],
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
          <ModalHeader><Heading>Cancel Your Subscription</Heading></ModalHeader>
        )}
        {action === 'delete' && (
          <ModalHeader><Heading>{`Delete Plan ${planName}`}</Heading></ModalHeader>
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
            {action === 'cancelAsOwner' && members.length > 0 && (
              <FormControl isRequired>
                <FormLabel>Change plan&apos;s owner:</FormLabel>
                <Select value={newOwner} onChange={(e) => setNewOwner(e.target.value)}>
                  {members.map((member) => (
                    <option key={member.username} value={member.username}>{member.fullName}</option>
                  ))}
                </Select>
                {selectError && (<FormErrorMessage>{selectError}</FormErrorMessage>)}
              </FormControl>
            )}
            {!inDashboard && (
              <Text textStyle="note">
                Once your request has been successfully processed, you will be redirected to the Dashboard.
              </Text>
            )}
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
