import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import {
  Flex, Box, FormControl, FormLabel, Heading, Button, Input, UnorderedList, ListItem
} from '@chakra-ui/react';
import { JoinPlan as JOIN_PLAN } from '../graphql/mutations.gql';
import { ViewOnePlan as GET_PLAN } from '../graphql/queries.gql';

export default function JoinPlan({
  setPlanToJoin, setStripeClientSecret, setSetupIntentId, setPaymentMethods,
}) {
  const navigate = useNavigate();
  const { planId } = useParams();
  const [quantity, setQuantity] = useState(0);

  const { loading: getPlanLoading, data: getPlanData, error: getPlanError } = useQuery(GET_PLAN, {
    variables: { planId: planId.toString().trim() },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-only',
  });

  // will need to handle this payLoading state on client side so user knows what to expect
  const [makePayment, { data: payData, loading: payLoading, error: payError}] = useMutation(
    JOIN_PLAN,
    {
      onCompleted: ({ joinPlan: { clientSecret, setupIntentId, paymentMethods } }) => {
        setStripeClientSecret(clientSecret);
        setSetupIntentId(setupIntentId);
        setPaymentMethods(paymentMethods);
        navigate('/checkout');
      },
      onError: ({ message }) => { console.log(message); },
    }
  );

  useEffect(() => {
    if (planId) {
      setPlanToJoin(planId.toString().trim());
    }
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    makePayment({
      variables: {
        planId,
        quantity
      }
    });
  };

  if (getPlanError) {
    const { message } = getPlanError;
    if (message === 'No plan matched search') {
      return message; // consider how UI should handle this
    }
  }

  if (getPlanData) {
    const {
      name, owner, cycleFrequency, perCycleCost, activeMembers, quantity
    } = getPlanData.viewOnePlan;

    return (
      <Flex width="full" align="center" justifyContent="center">
        <Box p={2} my={8} width="40%" bg="white" borderRadius="15">
          <Box textAlign="center">
            <Heading>Join this Plan!</Heading>
            <Heading size="xl">{name}</Heading>
          </Box>
          <Box my={4} textAlign="left">
            <div>
              Owned by:&nbsp;
              {owner.firstName.concat(' ', owner.lastName)}
            </div>
            <div>{`Total Plan Cost: $${perCycleCost} ${cycleFrequency.toLowerCase()}`}</div>
            {activeMembers.length > 0 && (
              <>
                <div>Others on this plan:</div>
                <UnorderedList>
                  {activeMembers.map((member) => (
                    <ListItem key={member.username}>{`${member.firstName} ${member.lastName} x ${member.quantity}`}</ListItem>
                  ))}
                </UnorderedList>
              </>
            )}
            {activeMembers.length === 0
              && (<div>There are currently no members on this plan.</div>)}
            {quantity > 0 ? (
              <div>
                <p>{`Your quantity on this plan: ${quantity}`}</p>
                <p>
                  You cannot join this plan again.
                  Please use the dashboard to adjust your membership on this plan.
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit}>
                <FormControl
                  isRequired
                >
                  <FormLabel>Quantity</FormLabel>
                  <Input
                    type="number"
                    name="quantity"
                    placeholder="Quantity"
                    min="1"
                    onChange={(e) => { setQuantity(Number(e.target.value)); }}
                  />
                </FormControl>
                <Button type="submit" disabled={!!quantity || payLoading} isLoading={payLoading}>Join</Button>
              </form>
            )}
            <Button onClick={() => { navigate('/dashboard'); }}>Cancel</Button>
          </Box>
        </Box>
      </Flex>
    );
  }
  return null;
}
