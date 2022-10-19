import React from 'react';
import { useMutation } from '@apollo/client';
import { EditQuantity as EDIT_QUANTITY } from '../graphql/mutations.gql';
// import { ViewAllPlans as GET_ALL_PLANS } from '../graphql/queries.gql';

export default function ConfirmModifyQuant({ plan, setModal, newQuantity }) {
  const { subscriptionId, activeMembers, quantity } = plan;
  const members = activeMembers.map((member) => (member.firstName));
  const membersStr = members.length > 1
    ? members.slice(0, -1).join(', ').concat(', and ', members[members.length - 1])
    : members[0];

  const [confirmQuantChange, { data, loading, error }] = useMutation(EDIT_QUANTITY, {
    onCompleted: () => { setModal(null); },
    update: (cache, { data: { editQuantity }}) => {
      const { planId, quantity: resultQuant } = editQuantity;
      console.log('----------> this is cache', cache);
      console.log(planId, resultQuant);
      cache.modify({
        id: `Plan:{"planId":"${planId}"}`,
        fields: {
          quantity() { return resultQuant; },
        }
      });
    },
    // refetchQueries: [{ query: GET_ALL_PLANS }, 'ViewAllPlans'],
  });

  const handleConfirmQuantChange = () => {
    confirmQuantChange({ variables: { subscriptionId, newQuantity } });
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
      <p>{`Current quantity: ${quantity}`}</p>
      <p>{`New quantity: ${newQuantity}`}</p>
      <button type="button" onClick={handleConfirmQuantChange}>Update quantity!</button>
    </div>
  );
}
