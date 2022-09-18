import React from 'react';
import { useParams } from 'react-router-dom';

export default function JoinPlan() {
  const { planId } = useParams();

  return (
    <>
      <h1>This is the Join Subscription page</h1>
      {console.log(planId)}
    </>

  );
}
