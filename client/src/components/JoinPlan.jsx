import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { Pay as PAY } from '../graphql/mutations.gql';
import { ViewOnePlan as GET_PLAN } from '../graphql/queries.gql';

export default function JoinPlan({ setPlanToJoin, setStripeClientSecret }) {
  const navigate = useNavigate();
  const { planId } = useParams();
  const [quantity, setQuantity] = useState(0);

  const { loading: getPlanLoading, data: getPlanData, error: getPlanError } = useQuery(GET_PLAN, {
    variables: { planId: planId.toString().trim() },
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'cache-and-network',
  });

  // will need to handle this payLoading state on client side so user knows what to expect
  const [makePayment, { data: payData, loading: payLoading, error: payError}] = useMutation(PAY, {
    onCompleted: ({ pay }) => {
      setStripeClientSecret(pay.clientSecret);
      localStorage.setItem('clientSecret', pay.clientSecret);
      navigate('/checkout');
    },
    onError: ({ message }) => { console.log(message); },
  });

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
      name, owner, cycleFrequency, perCycleCost, activeMembers,
    } = getPlanData.viewOnePlan;

    return (
      <>
        <h1>This is the Join Subscription page</h1>
        <h2>{name}</h2>
        <div>
          Owned by:&nbsp;
          {owner.firstName.concat(' ', owner.lastName)}
        </div>
        <div>{`Total Plan Cost: $${perCycleCost} ${cycleFrequency.toLowerCase()}`}</div>
        {activeMembers.length > 0 && (
          <>
            <div>Others on this plan:</div>
            <ul>
              {activeMembers.map((member) => (
                <li key={member.username}>{`${member.firstName} ${member.lastName} x ${member.quantity}`}</li>
              ))}
            </ul>
          </>
        )}
        {activeMembers.length === 0
          && (<div>There are currently no members on this plan.</div>)}
        <form onSubmit={onSubmit}>
          <input
            type="number"
            placeholder="Quantity"
            required
            min="1"
            onChange={(e) => { setQuantity(Number(e.target.value)); }}
          />
          <button type="submit">Join</button>
        </form>
        <button type="button" onClick={() => { navigate('/dashboard'); }}>Cancel</button>
      </>
    );
  }
  return null;
}
