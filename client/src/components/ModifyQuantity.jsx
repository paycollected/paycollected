import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import {
  Unsubscribe as UNSUBSCRIBE,
  UnsubscribeAsPlanOwner as UNSUBSCRIBE_AS_OWNER
} from '../graphql/mutations.gql';
import { ViewAllPlans as GET_ALL_PLANS } from '../graphql/queries.gql';

export default function ModifyQuantity({ plan, setModal }) {
  const { subscriptionId, planId, activeMembers, owner } = plan;
  const [newOwner, setNewOwner] = useState(
    activeMembers.length > 0 ? activeMembers[0].username : null
  );
  const members = activeMembers.map((member) => (member.firstName));
  const membersStr = members.length > 1
    ? members.slice(0, -1).join(', ').concat(', and ', members[members.length - 1])
    : members[0];

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
      <p>{`Your quantity: ${plan.quantity}`}</p>
      <button type="button" onClick={() => { }}>Confirm cancellation</button>
    </div>
  );
}
