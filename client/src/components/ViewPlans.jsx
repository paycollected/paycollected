import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import Button from '@mui/material/Button';
import { ViewAllPlans } from '../graphql/queries.gql';
import { EditPayment } from '../graphql/mutations.gql';

const GET_ALL_PLANS = ViewAllPlans;
const EDIT_PAYMENT = EditPayment;

export default function ViewPlans() {
  const navigate = useNavigate();
  // this component will display all existing plans for this user (query from backend)
  // it will also include a link to Stripe page, can cancel subscriptions

  const { loading, data, error } = useQuery(GET_ALL_PLANS, {
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'cache-and-network',
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
      <h1>This is the ViewSubscriptions page to list all subscriptions</h1>
      <Button variant="contained" onClick={() => { navigate('/dashboard'); }}>Dashboard</Button>
      <Button variant="contained" onClick={() => { submitEditPayment(); }}>Manage Payment Methods</Button>
      {/* cannot update quantity or update payment method via Stripe customer portal directly
      because our backend is on a separate server */}
      {data
        && (data.viewAllPlans.map((plan) => (
          <div key={plan.planId}>
            <h2>{plan.name}</h2>
            <div>
              Owned by:&nbsp;
              {plan.owner.firstName.concat(' ', plan.owner.lastName)}
            </div>
            <div>{`Total Plan Cost: $${plan.perCycleCost} ${plan.cycleFrequency.toLowerCase()}`}</div>
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
              && (<div>There are currently no members on this plan.</div>)}
          </div>
        )))}
    </div>
  );
}
