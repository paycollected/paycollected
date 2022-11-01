import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Flex, Box, Grid, GridItem, Heading, Button, useClipboard, UnorderedList, ListItem, Tooltip
} from '@chakra-ui/react';
import { CopyIcon } from '@chakra-ui/icons';
import { ViewAllPlans as GET_ALL_PLANS } from '../graphql/queries.gql';
import { EditPayment as EDIT_PAYMENT } from '../graphql/mutations.gql';
import ConfirmCancel from './ConfirmCancel.jsx';
import ModifyQuantity from './ModifyQuantity.jsx';
import ConfirmDeletePlan from './ConfirmDeletePlan.jsx';

export default function ViewPlans({ user }) {
  const [planToCopy, setPlanToCopy] = useState(null);
  const { hasCopied, onCopy } = useClipboard(`${process.env.HOST}/join/${planToCopy}`);

  const { loading, data, error } = useQuery(GET_ALL_PLANS, {
    fetchPolicy: 'cache-and-network',
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

  return (
    <div>
      <Button onClick={() => { submitEditPayment(); }}>Manage Payment Methods</Button>
      {console.log('------> planToCopy', planToCopy)}
      {console.log('------> string', `${process.env.HOST}/join/${planToCopy}`)}
      <Flex justifyContent="center">
        <Box p={2} my={8} width="60%" bg="white" borderRadius="15">
          <Box textAlign="center">
            <Heading>Your Subscriptions</Heading>
          </Box>
          {data
            && (data.viewAllPlans.map((plan) => (
              <div
                key={plan.name}
                onMouseEnter={() => { setPlanToCopy(plan.planId); }}
              >
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
                        <UnorderedList>
                          {plan.activeMembers.map((member) => (
                            <ListItem key={member.username}>{`${member.firstName} ${member.lastName} x ${member.quantity}`}</ListItem>
                          ))}
                        </UnorderedList>
                      </>
                    )}
                    {plan.activeMembers.length === 0
                      && (<div>There are currently no other members on this plan.</div>)}
                    Copy link to join:&nbsp;
                    <Tooltip label={hasCopied ? 'Copied to clipboard' : 'Click to copy'}>
                      <CopyIcon onClick={onCopy} />
                    </Tooltip>
                  </GridItem>
                  <GridItem colSpan={1} textAlign="center">
                    <ModifyQuantity
                      originalQuant={plan.quantity}
                      plan={plan}
                    />
                    <br></br>
                    {(plan.owner.username !== user
                      || (plan.owner.username === user && plan.activeMembers.length > 0))
                      && (
                        <ConfirmCancel plan={plan} user={user} />
                      )}
                    {plan.owner.username === user && (
                      <ConfirmDeletePlan plan={plan} />
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
