import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { Button } from '@chakra-ui/react';
import { ViewAllPlans as GET_ALL_PLANS } from '../graphql/queries.gql';
import { EditPayment as EDIT_PAYMENT } from '../graphql/mutations.gql';
import ConfirmCancel from './ConfirmCancel.jsx';
import ModifyQuantity from './ModifyQuantity.jsx';
import ConfirmModifyQuant from './ConfirmModifyQuant.jsx';
import ConfirmDeletePlan from './ConfirmDeletePlan.jsx';

export default function ViewPlans({ user }) {
  const navigate = useNavigate();
  const [modal, setModal] = useState(null);
  const [planToModify, setPlanToModify] = useState(null);
  const [newQuant, setNewQuant] = useState(null);

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

  const handleSubsModification = (plan, modalName) => {
    setModal(modalName);
    setPlanToModify(plan);
  };

  return (
    <div>
      <h1>This is the ViewSubscriptions page to list all subscriptions</h1>
      {modal === 'confirmCancel' && (<ConfirmCancel plan={planToModify} setModal={setModal} user={user} />)}
      {modal === 'confirmQuantChange' && (<ConfirmModifyQuant plan={planToModify} setModal={setModal} newQuantity={newQuant} />)}
      {modal === 'confirmDeletePlan' && (<ConfirmDeletePlan plan={planToModify} setModal={setModal} />)}
      <Button onClick={() => { navigate('/dashboard'); }}>Dashboard</Button>
      <Button onClick={() => { submitEditPayment(); }}>Manage Payment Methods</Button>
      {data
        && (data.viewAllPlans.map((plan) => (
          <div
            key={plan.planId}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h2>{plan.name}</h2>
              <div>
                Owned by:&nbsp;
                {plan.owner.username !== user ? plan.owner.firstName.concat(' ', plan.owner.lastName) : 'you'}
              </div>
              <div>{`Total Plan Cost: $${plan.perCycleCost} ${plan.cycleFrequency.toLowerCase()}`}</div>
              <div>{`Your quantity: ${plan.quantity}`}</div>
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
                && (<div>There are currently no other members on this plan.</div>)}
            </div>
            <div style={{ display: 'grid', alignContent: 'center', gap: '1.5rem' }}>
              <ModifyQuantity
                quantity={plan.quantity}
                setModal={setModal}
                setNewQuant={setNewQuant}
                plan={plan}
                setPlanToModify={setPlanToModify}
              />
              <button
                type="button"
                onClick={() => { handleSubsModification(plan, 'confirmCancel'); }}
                disabled={plan.activeMembers.length === 0}
                style={{ width: '150px', justifySelf: 'center' }}
              >
                Cancel subscription
              </button>
              {plan.owner.username === user && (
                <button
                  type="button"
                  onClick={() => { handleSubsModification(plan, 'confirmDeletePlan'); }}
                  style={{ width: '150px', justifySelf: 'center' }}
                >
                  Delete plan
                </button>
              )}
            </div>
          </div>
        )))}
      {data && data.viewAllPlans.length === 0
        && (<div>You are not enrolled in any plans at the moment.</div>)}
    </div>
  );
}
