import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import {
  Unsubscribe as UNSUBSCRIBE,
  UnsubscribeAsPlanOwner as UNSUBSCRIBE_AS_OWNER
} from '../graphql/mutations.gql';

export default function ConfirmCancel({ planToCancel: plan, setModal, user }) {
  // const { plan, owner } = planToCancel;
  const { subscriptionId, planId, activeMembers, owner } = plan;
  const members = activeMembers.map((member) => (member.firstName));
  const membersStr = members.length > 1
    ? members.slice(0, -1).join(', ').concat(', and ', members[members.length - 1])
    : members[0];

  const [confirmUnsubscribe, { data, loading, error }] = useMutation(UNSUBSCRIBE, {
    onCompleted: () => {
      setModal(null);
    }
  });

  const [
    confirmUnsubscribeAsOwner,
    { data: ownerData, loading: ownerLoading, error: ownerError}
  ] = useMutation(UNSUBSCRIBE_AS_OWNER, {
    onCompleted: () => {
      setModal(null);
    }
  });

  const handleConfirmUnsubscribe = () => {
    if (owner.username !== user) {
      confirmUnsubscribe({ variables: { subscriptionId } });
    } else {
      confirmUnsubscribeAsOwner({
        variables: {
          subscriptionId, planId, newOwner
        }
      });
    }
  };

  console.log(plan);

  return (
    <div
      style={{
        zIndex: 500,
        position: 'fixed',
        background: 'white',
        border: '1px solid black',
        padding: '1rem',
      }}
    >
      <h2>{plan.name}</h2>
      {members.length > 0 && (<p>{`with ${membersStr}`}</p>)}
      <p>{`x${plan.quantity}`}</p>
      <p>Are you sure you want to drop out of this plan?</p>
      <button type="button" onClick={() => { setModal(null); }}>Back</button>
      <button type="button" onClick={handleConfirmUnsubscribe}>Confirm cancellation</button>
    </div>
  );
}
