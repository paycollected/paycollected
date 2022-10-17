import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import {
  Unsubscribe as UNSUBSCRIBE,
  UnsubscribeAsPlanOwner as UNSUBSCRIBE_AS_OWNER
} from '../graphql/mutations.gql';
import { ViewAllPlans as GET_ALL_PLANS } from '../graphql/queries.gql';

export default function ConfirmCancel({ plan, setModal, user }) {
  const { subscriptionId, planId, activeMembers, owner } = plan;
  const [newOwner, setNewOwner] = useState(
    activeMembers.length > 0 ? activeMembers[0].username : null
  );
  const members = activeMembers.map((member) => (member.firstName));
  const membersStr = members.length > 1
    ? members.slice(0, -1).join(', ').concat(', and ', members[members.length - 1])
    : members[0];

  const [confirmUnsubscribe, { data, loading, error }] = useMutation(UNSUBSCRIBE, {
    onCompleted: () => { setModal(null); },
    refetchQueries: [{ query: GET_ALL_PLANS }, 'ViewAllPlans'],
  });

  const [
    confirmUnsubscribeAsOwner,
    { data: ownerData, loading: ownerLoading, error: ownerError}
  ] = useMutation(UNSUBSCRIBE_AS_OWNER, {
    onCompleted: () => { setModal(null); },
    refetchQueries: [{ query: GET_ALL_PLANS }, 'ViewAllPlans'],
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
      <button type="button" onClick={() => { setModal(null); }}>Back</button>
      <h2>{plan.name}</h2>
      {members.length > 0 && (<p>{`with ${membersStr}`}</p>)}
      <p>{`x${plan.quantity}`}</p>
      <p>Are you sure you want to drop out of this plan?</p>
      {owner.username === user && (
        <div>
          <p>Please transfer plan ownership to another member to proceed:</p>
          {activeMembers.map((member) => (
            <div key={member.username}>
              <input
                type="radio"
                value={member.username}
                checked={member.username === newOwner}
                onChange={(e) => { setNewOwner(e.target.value); }}
              />
              {member.firstName}
            </div>
          ))}
        </div>
      )}
      <button type="button" onClick={handleConfirmUnsubscribe}>Confirm cancellation</button>
    </div>
  );
}
