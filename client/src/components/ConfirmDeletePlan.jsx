import React from 'react';
import { useMutation } from '@apollo/client';
import { DeletePlan as DELETE_PLAN } from '../graphql/mutations.gql';
import { ViewAllPlans as GET_ALL_PLANS } from '../graphql/queries.gql';

export default function ConfirmDeletePlan({ plan, setModal }) {
  const { planId, activeMembers } = plan;
  const members = activeMembers.map((member) => (member.firstName));
  const membersStr = members.length > 1
    ? members.slice(0, -1).join(', ').concat(', and ', members[members.length - 1])
    : members[0];

  const [confirmDelete, { data, loading, error }] = useMutation(DELETE_PLAN, {
    onCompleted: () => { setModal(null); },
    refetchQueries: [{ query: GET_ALL_PLANS }, 'ViewAllPlans'],
  });

  const handleConfirmDelete = () => {
    confirmDelete({ variables: { planId } });
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
      <p>Are you sure you want to delete this plan?</p>
      <p>This action cannot be reversed and will make the plan unavailable to all current, active members on the plan.</p>
      <button type="button" onClick={handleConfirmDelete}>Confirm delete</button>
    </div>
  );
}
