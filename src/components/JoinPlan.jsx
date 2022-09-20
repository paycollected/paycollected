import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gql, useQuery } from '@apollo/client';

export default function JoinPlan({ setPlanToJoin }) {
  const navigate = useNavigate();
  const { planId } = useParams();

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
        otherMembers {
          firstName
          lastName
          username
          quantity
        }
      }
    }
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

  if (data) {
    const {
      name, owner, cycleFrequency, perCycleCost, otherMembers,
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
        {otherMembers.length > 0 && (
          <>
            <div>Others on this plan:</div>
            <ul>
              {otherMembers.map((member) => (
                <li key={member.username}>{`${member.firstName} ${member.lastName} x ${member.quantity}`}</li>
              ))}
            </ul>
          </>
        )}
        {otherMembers.length === 0
          && (<div>There are currently no members on this plan.</div>)}
        <button type="button" onClick={() => { navigate('/dashboard'); }}>Cancel</button>
        <button type="button" onClick={() => { navigate('/checkout'); }}>Pay</button>
      </>
    );
  }
  return null;
}
