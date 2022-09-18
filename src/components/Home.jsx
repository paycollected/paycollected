import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function Home({ setPlanToJoin }) {
  const navigate = useNavigate();
  const { planId } = useParams();

  useEffect(() => {
    if (planId) {
      setPlanToJoin(planId);
    }
  }, []);

  return (
    <div>
      <h1>This is the Home page</h1>
      <button type="button" onClick={() => { navigate('/login'); }}>Login</button>
      <button type="button" onClick={() => { navigate('/signup'); }}>Sign up</button>
    </div>
  );
}
