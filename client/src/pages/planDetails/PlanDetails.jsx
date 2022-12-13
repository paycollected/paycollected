import React, { useState } from 'react';
import {
  Button, Heading, VStack, Box, Flex, Card, CardHeader, CardBody, HStack, useDisclosure,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { useForm } from 'react-hook-form';
import { PlanDetails as GET_PLAN } from '../../graphql/queries.gql';
import {
  EditQuantity as EDIT_QUANTITY,
  TransferPlanOwnership as TRANSFER,
  EditSubsQuantAndTransferOwnership as EDIT_QUANT_AND_TRANSFER,
} from '../../graphql/mutations.gql';
import ActionConfirmationModal from './ActionConfirmationModal.jsx';
import NavBar from '../../components/NavBar.jsx';
import EditableGrid from './EditableGrid.jsx';
import updateActiveMembersInCache from './cacheUpdatingFns.js';

export default function PlanDetails({
  user, setUser, setPlanToJoin, planToView, setPlanToView, edit,
}) {
  const [editAsOwner, setEditAsOwner] = useState(edit);
  const [editAsMember, setEditAsMember] = useState(false);
  const [action, setAction] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm();

  const { loading, data, error } = useQuery(GET_PLAN, {
    variables: { planId: planToView },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-only',
  });

  const [changeQuant, {
    loading: changeQuantLoading, error: changeQuantError
  }] = useMutation(EDIT_QUANTITY, {
    onCompleted: () => {
      setEditAsMember(false);
      setEditAsOwner(false);
    },
    update: (cache, { data: { editQuantity: { planId, quantity: resultQuant} } }) => {
      cache.modify({
        id: `PlanDetail:{"planId":"${planId}"}`,
        fields: {
          quantity() { return resultQuant; },
        }
      });
    },
  });

  const [transfer, { loading: transferLoading, error: transferError }] = useMutation(TRANSFER, {
    onCompleted: () => {
      setEditAsOwner(false);
    },
    update: (cache, { data: { transferOwnership: { planId, newOwner } } }) => {
      cache.modify({
        id: `PlanDetail:{"planId":"${planId}"}`,
        fields: {
          isOwner() { return false; },
          activeMembers(members) { return updateActiveMembersInCache(members, newOwner); },
          owner() { return newOwner; },
        }
      });
    },
  });

  const [transferAndEditQuant, {
    loading: transferEditLoading, error: transferEditError
  }] = useMutation(EDIT_QUANT_AND_TRANSFER, {
    onCompleted: () => {
      setEditAsOwner(false);
    },
    update: (cache, {
      data: {
        transferOwnership: { newOwner },
        editQuantity: { planId, quantity: resultQuant },
      }
    }) => {
      cache.modify({
        id: `PlanDetail:{"planId":"${planId}"}`,
        fields: {
          quantity() { return resultQuant; },
          isOwner() { return false; },
          owner() { return newOwner; },
          activeMembers(members) { return updateActiveMembersInCache(members, newOwner); },
        }
      });
    },
  });


  if (data) {
    const {
      viewOnePlan: {
        planId, name, cycleFrequency, perCycleCost, startDate, owner, isOwner, selfCost,
        totalMembers, subscriptionId, activeMembers, quantity, totalQuantity,
      }
    } = data;

    const startDateAsArr = startDate.split('-');
    const fStartDate = `${startDateAsArr[1]}/${startDateAsArr[2]}/${startDateAsArr[0]}`;

    const handleFormSubmit = (inputData) => {
      const { newQuantity } = inputData;
      if (isOwner) {
        const { newOwner } = inputData;
        switch (true) {
          case (newQuantity !== quantity && newOwner === user):
            // only quantity is changed
            changeQuant({ variables: { subscriptionId, newQuantity } });
            break;
          case (newQuantity === quantity && newOwner !== user):
            // only new owner is changed
            transfer({ variables: { planId, newOwner } });
            break;
          case (newQuantity === quantity && newOwner === user):
            // no change
            setEditAsOwner(false);
            break;
          default:
            // both quantity and owner have been changed
            transferAndEditQuant({
              variables: {
                planId, newOwner, subscriptionId, newQuantity
              }
            });
            break;
        }
      } else {
        if (newQuantity !== quantity) {
          changeQuant({ variables: { subscriptionId, newQuantity } });
        } else {
          setEditAsMember(false);
        }
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
        <VStack w="93%" justify="left" spacing={{ base: 6, md: 10 }} mb={{ base: 6, md: 10 }}>
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
            <Flex w={{ base: '95%', lg: '80%' }} align="center" justify="space-between" mb={10}>
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
                      editAsOwner={editAsOwner}
                      user={user}
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
                      editAsOwner={editAsOwner}
                      user={user}
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
