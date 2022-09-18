import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { gql, useQuery } from '@apollo/client';

export default function JoinPlan({ setPlanToJoin }) {
  const { planId } = useParams();

  useEffect(() => {
    if (planId) {
      setPlanToJoin(planId);
    }
  }, []);

  // const GET_PLAN = gql`
  //   query
  // `;

  return (
    <>
      <h1>This is the Join Subscription page</h1>
      <button type="button" onClick={() => { navigate('/login'); }}>Login</button>
    </>

  );
}
