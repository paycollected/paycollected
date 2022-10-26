import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import {
  Flex, Box, Grid, GridItem, Heading, Button, useClipboard
} from '@chakra-ui/react';
import { ViewAllPlans as GET_ALL_PLANS } from '../graphql/queries.gql';
import { EditPayment as EDIT_PAYMENT } from '../graphql/mutations.gql';
import ConfirmCancel from './ConfirmCancel.jsx';
import ModifyQuantity from './ModifyQuantity.jsx';
import ConfirmModifyQuant from './ConfirmModifyQuant.jsx';
import ConfirmDeletePlan from './ConfirmDeletePlan.jsx';

export default function ViewPlans({ user }) {
  const navigate = useNavigate();
  const [modal, setModal] = useState(null);
  const [planToModify, setPlanToModify] = useState(null);
  const [planToCopy, setPlanToCopy] = useState(null);
  const [newQuant, setNewQuant] = useState(null);
  const { hasCopied, onCopy } = useClipboard(`${process.env.CLIENT_HOST}:${process.env.SERVER_PORT}/join/${planToCopy}`);

  const { loading, data, error } = useQuery(GET_ALL_PLANS, {
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'cache-only',
  });

  const [
    submitEditPayment,
    { loading: editPaymentLoading, error: editPaymentError, data: editPaymentData }
  ] = useMutation(EDIT_PAYMENT, {
    onCompleted: ({ editPayment }) => {
      const { portalSessionURL } = editPayment;
      window.location.replace(portalSessionURL);
    },
    onError: ({ message }) => { console.log(message); }
  });

  const handleSubsModification = (plan, modalName) => {
    setModal(modalName);
    setPlanToModify(plan);
  };

  return (
    <div>
      {modal === 'confirmCancel' && (<ConfirmCancel plan={planToModify} setModal={setModal} user={user} />)}
      {modal === 'confirmQuantChange' && (<ConfirmModifyQuant plan={planToModify} setModal={setModal} newQuantity={newQuant} />)}
      {modal === 'confirmDeletePlan' && (<ConfirmDeletePlan plan={planToModify} setModal={setModal} />)}
      <Button onClick={() => { navigate('/dashboard'); }}>Dashboard</Button>
      <Button onClick={() => { submitEditPayment(); }}>Manage Payment Methods</Button>
      <Flex justifyContent="center">
        <Box p={2} my={8} width="60%" bg="white" borderRadius="15">
          <Box textAlign="center">
            <Heading>Your Subscriptions</Heading>
          </Box>
          {data
            && (data.viewAllPlans.map((plan) => (
              <div key={plan.name}>
                <Grid templateColumns="repeat(3, 1fr)" gap={3} mb={3}>
                  <GridItem colSpan={2} textAlign="left">
                    <Heading size="xl">{plan.name}</Heading>
                    <div>
                      Owned by:&nbsp;
                      {plan.owner.username !== user ? plan.owner.firstName.concat(' ', plan.owner.lastName) : 'you'}
                    </div>
                    <div>{`Total Plan Cost: $${plan.perCycleCost} ${plan.cycleFrequency.toLowerCase()}`}</div>
                    <div>{`Your quantity: ${plan.quantity}`}</div>
                    {plan.activeMembers.length > 0 && (
                      <>
                        <div>Others on this plan:</div>
                        <ul>
                          {plan.activeMembers.map((member) => (
                            <li key={member.username}>{`${member.firstName} ${member.lastName} x ${member.quantity}`}</li>
                          ))}
                        </ul>
                      </>
                    )}
                    {plan.activeMembers.length === 0
                      && (<div>There are currently no other members on this plan.</div>)}
                    {planToCopy === plan.planId ? (
                      <Box>
                        {`Link to join: ${process.env.CLIENT_HOST}:${process.env.SERVER_PORT}/join/${plan.planId}`}
                        <Button variant="outline" size="sm" onClick={onCopy}>
                          {hasCopied ? 'Copied' : 'Copy'}
                        </Button>
                      </Box>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => setPlanToCopy(plan.planId)}>Show Link</Button>
                    )}
                  </GridItem>
                  <GridItem colSpan={1} textAlign="center">
                    <ModifyQuantity
                      quantity={plan.quantity}
                      setModal={setModal}
                      setNewQuant={setNewQuant}
                      plan={plan}
                      setPlanToModify={setPlanToModify}
                    />
                    <br></br>
                    {(plan.owner.username !== user
                      || (plan.owner.username === user && plan.activeMembers.length > 0))
                      && (
                        <Button
                          type="button"
                          onClick={() => { handleSubsModification(plan, 'confirmCancel'); }}
                        >
                          Cancel subscription
                        </Button>
                      )}
                    {plan.owner.username === user && (
                      <Button
                        onClick={() => { handleSubsModification(plan, 'confirmDeletePlan'); }}
                      >
                        Delete plan
                      </Button>
                    )}
                  </GridItem>
                </Grid>
              </div>
            )))}
          {data && data.viewAllPlans.length === 0
            && (<div>You are not enrolled in any plans at the moment.</div>)}
        </Box>
      </Flex>
    </div>
  );
}
