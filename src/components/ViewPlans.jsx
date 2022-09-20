import React from 'react';
import { useNavigate } from 'react-router-dom';
import { gql, useQuery } from '@apollo/client';
import Button from '@mui/material/Button';

export default function ViewPlans() {
  const navigate = useNavigate();
  // this component will display all existing plans for this user (query from backend)
  // it will also include a link to Stripe page, can cancel subscriptions

  const GET_ALL_PLANS = gql`
    query {
      viewAllPlans {
        planId
        name
        owner {
          firstName
          lastName
          username
        }
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

  const { loading, data, error } = useQuery(GET_ALL_PLANS, {
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'cache-and-network',
  });

  return (
    <div>
      <h1>This is the ViewSubscriptions page to list all subscriptions</h1>
      {data
        && (data.viewAllPlans.map((plan) => (
          <div key={plan.planId}>
            <div>
              Owned by:&nbsp;
              {plan.owner.firstName.concat(' ', plan.owner.lastName)}
            </div>
            <div>{`Total Plan Cost: $${plan.perCycleCost} ${plan.cycleFrequency.toLowerCase()}`}</div>
            {plan.otherMembers.length > 0 && (
              <>
                <div>Others on this plan:</div>
                <ul>
                  {plan.otherMembers.map((member) => (
                    <li key={member.username}>{`${member.firstName} ${member.lastName} x ${member.quantity}`}</li>
                  ))}
                </ul>
              </>
            )}
            {plan.otherMembers.length === 0
              && (<div>There are currently no members on this plan.</div>)}
          </div>
        )))}
      <Button variant="contained" onClick={() => { navigate('/dashboard'); }}>Dashboard</Button>
    </div>
  );
}
