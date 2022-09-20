import React from 'react';
import { useNavigate } from 'react-router-dom';
import { gql, useQuery } from '@apollo/client';
import Button from '@mui/material/Button';

export default function ViewPlans() {
  const navigate = useNavigate();
  // this component will display all existing plans for this user (query from backend)
  // it will also include a link to Stripe page, can cancel subscriptions

  const GET_ALL_PLANS = gql`
    query() {
      viewAllPlans() {

      }
    }
  `;

  const { loading, data, error } = useQuery(GET_ALL_PLANS, {

  });

  return (
    <div>
      <h1>This is the ViewSubscriptions page to list all subscriptions</h1>
      {data ?
        (plans.map((plan) => (
          <div>
            <div>
            Owned by:&nbsp;
            {plan.owner.firstName.concat(' ', plan.owner.lastName)}
            </div>
            <div>{`Total Plan Cost: $${plan.perCycleCost} ${plan.cycleFrequency.toLowerCase()}`}</div>
            {plan.otherMembers.length > 0 && (
              <>
                <div>Others on this plan:</div>
                <ul>
                  {plan.otherMembers.map((member) => (<li key={member.username}>{member.firstName.concat(' ', member.lastName)}</li>))}
                </ul>
              </>
            )}
            {plan.otherMembers.length === 0
              && (<div>There is currently no other members on this plan.</div>)}
          </div>
        ))) : null}
      <Button variant="contained" onClick={() => { navigate('/dashboard'); }}>Cancel</Button>
    </div>
  );
}
