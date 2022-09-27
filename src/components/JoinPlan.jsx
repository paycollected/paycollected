import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gql, useQuery, useMutation } from '@apollo/client';

export default function JoinPlan({ setPlanToJoin, setStripeClientSecret }) {
  const navigate = useNavigate();
  const { planId } = useParams();
  const [planQuantity, setPlanQuantity] = useState(0);

  const GET_PLAN = gql`
    query ($planId: String!) {
      viewOnePlan(planId: $planId) {
        name
        owner {
          firstName
          lastName
          username
        },
        cycleFrequency
        perCycleCost
        maxNumberOfMembers
        activeMembers {
          firstName
          lastName
          username
          quantity
        }
      }
    }
  `;

  const PAY = gql`
  `;

  const { loading, data, error } = useQuery(GET_PLAN, {
    variables: { planId: planId.toString().trim() },
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'cache-and-network',
  });

  useEffect(() => {
    if (planId) {
      setPlanToJoin(planId.toString().trim());
    }
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();

    navigate('/checkout');
  };

  if (data) {
    const {
      name, owner, cycleFrequency, perCycleCost, maxNumberOfMembers, activeMembers,
    } = data.viewOnePlan;

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
            max={maxNumberOfMembers - activeMembers.length}
            onChange={(e) => { setPlanQuantity(e.target.value); }}
          />
          <button type="submit">Join</button>
        </form>
        <button type="button" onClick={() => { navigate('/dashboard'); }}>Cancel</button>
      </>
    );
  }
  return null;
}
