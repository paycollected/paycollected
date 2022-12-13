import React, { useState } from 'react';
import {
  Button, Heading, VStack, Box, Flex, Card, CardHeader, CardBody, HStack, useDisclosure,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { useForm } from 'react-hook-form';
import { PlanDetails as GET_PLAN } from '../../graphql/queries.gql';
import { EditQuantity as EDIT_QUANTITY } from '../../graphql/mutations.gql';
import ActionConfirmationModal from './ActionConfirmationModal.jsx';
import NavBar from '../../components/NavBar.jsx';
import EditableGrid from './EditableGrid.jsx';

export default function PlanDetails({
  user, setUser, setPlanToJoin, planToView, setPlanToView, edit,
}) {
  const [editAsOwner, setEditAsOwner] = useState(edit);
  const [editAsMember, setEditAsMember] = useState(false);
  const [action, setAction] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const { loading, data, error } = useQuery(GET_PLAN, {
    variables: { planId: planToView },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-only',
  });

  const [changeQuant, {
    data: changeQuantData,
    loading: changeQuantLoading,
    error: changeQuantError
  }] = useMutation(EDIT_QUANTITY, {
    onCompleted: () => {
      setEditAsMember(false);
      setEditAsOwner(false);
    },
  });

  const { register, handleSubmit } = useForm();

  if (data) {
    const {
      viewOnePlan: {
        planId, name, cycleFrequency, perCycleCost, startDate, owner, isOwner, quantity, selfCost,
        totalMembers, totalQuantity, subscriptionId, activeMembers,
      }
    } = data;
    const startDateAsArr = startDate.split('-');
    const fStartDate = `${startDateAsArr[1]}/${startDateAsArr[2]}/${startDateAsArr[0]}`;
    const handleFormSubmit = (inputData) => {
      if (isOwner) {
        console.log(inputData);
        // setEditAsOwner(false);
      } else {
        changeQuant({ variables: { subscriptionId, newQuantity: inputData.newQuantity } });
      }
    };

    return (
      <>
        <NavBar
          user={user}
          setUser={setUser}
          setPlanToJoin={setPlanToJoin}
          setPlanToView={setPlanToView}
        />
        <ActionConfirmationModal
          onClose={onClose}
          isOpen={isOpen}
          action={action}
          planName={name}
          planId={planId}
          subscriptionId={subscriptionId}
          members={activeMembers}
          setPlanToView={setPlanToView}
        />
        <VStack w="93%" justify="left" spacing={{ base: 4, md: 6 }} mb={{ base: 4, md: 6 }}>
          <Flex w="100%" align="center">
            <Button
              type="button"
              variant="navActionBtn"
              onClick={() => {
                setPlanToView(null);
                navigate('/dashboard');
              }}
              h="max-content"
            >
              Back to Dashboard
            </Button>
          </Flex>
          <Box w="100%">
            <Flex w={{ base: '95%', lg: '80%' }} align="center" justify="space-between" mb={6}>
              <Heading as="h1" variant="accented" pb={0}>{name}</Heading>
              <Button type="button">Share Plan</Button>
            </Flex>
            <Card w={{ base: '95%', lg: '80%' }}>
              {!isOwner && (
                <>
                  <CardHeader mx={6} mt={8} pb={0}>
                    <Heading as="h2" variant="nuanced">
                      Plan Details
                    </Heading>
                  </CardHeader>
                  <CardBody mx={6} mb={8} mt={0}>
                    <EditableGrid
                      name={name}
                      fStartDate={fStartDate}
                      isOwner={isOwner}
                      owner={owner}
                      cycleFrequency={cycleFrequency}
                      perCycleCost={perCycleCost}
                      quantity={quantity}
                      selfCost={selfCost}
                      totalMembers={totalMembers}
                      totalQuantity={totalQuantity}
                      activeMembers={activeMembers}
                      register={register}
                      handleSubmit={handleSubmit}
                      handleFormSubmit={handleFormSubmit}
                      editAsMember={editAsMember}
                      setEditAsMember={setEditAsMember}
                    />
                    <Box w="100%">
                      <Button
                        type="button"
                        variant="navActionBtn"
                        onClick={() => {
                          setAction('cancel');
                          onOpen();
                        }}
                      >
                        Cancel your subscription
                      </Button>
                    </Box>
                  </CardBody>
                </>
              )}
              {isOwner && (
                <form onSubmit={handleSubmit(handleFormSubmit)}>
                  <CardHeader mx={6} mt={8} pb={0}>
                    <Flex justify="space-between">
                      <Heading as="h2" variant="nuanced">
                        Plan Details
                      </Heading>
                      {!editAsOwner && (
                        <Button type="button" size="sm" onClick={() => setEditAsOwner(true)}>Edit Plan</Button>
                      )}
                      {editAsOwner && (
                        <HStack>
                          <Button type="button" size="sm" variant="outlineNuanced" onClick={() => setEditAsOwner(false)}>Cancel</Button>
                          <Button type="submit" size="sm">Save</Button>
                        </HStack>
                      )}
                    </Flex>
                  </CardHeader>
                  <CardBody mx={6} mb={8} mt={0}>
                    <EditableGrid
                      name={name}
                      fStartDate={fStartDate}
                      isOwner={isOwner}
                      owner={owner}
                      cycleFrequency={cycleFrequency}
                      perCycleCost={perCycleCost}
                      quantity={quantity}
                      selfCost={selfCost}
                      totalMembers={totalMembers}
                      totalQuantity={totalQuantity}
                      activeMembers={activeMembers}
                      register={register}
                      handleSubmit={handleSubmit}
                      handleFormSubmit={handleFormSubmit}
                      editAsMember={editAsMember}
                      setEditAsMember={setEditAsMember}
                    />
                    {totalMembers > 1 && (
                      <VStack justify="left">
                        <Box w="100%">
                          <Button
                            type="button"
                            variant="navActionBtn"
                            onClick={() => {
                              setAction('cancelAsOwner');
                              onOpen();
                            }}
                          >
                            Cancel your subscription
                          </Button>
                        </Box>
                        <Box w="100%">
                          <Button
                            type="button"
                            variant="navActionBtn"
                            onClick={() => {
                              setAction('delete');
                              onOpen();
                            }}
                          >
                            Delete this plan
                          </Button>
                        </Box>
                      </VStack>
                    )}
                    {totalMembers === 1 && (
                      <Button
                        type="button"
                        variant="navActionBtn"
                        onClick={() => {
                          setAction('delete');
                          onOpen();
                        }}
                      >
                        Delete this plan
                      </Button>
                    )}
                  </CardBody>
                </form>
              )}
            </Card>
          </Box>
        </VStack>
      </>
    );
  }
  return null;
}
