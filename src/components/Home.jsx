import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '@mui/material/Button';

export default function Home({ setPlanToJoin }) {
  const navigate = useNavigate();
  const { planId } = useParams();

  useEffect(() => {
    if (planId) {
      setPlanToJoin(planId.toString().trim());
    }
  }, []);

  return (
    <div>
      <h1>This is the Home page</h1>
      <Button variant="contained" onClick={() => { navigate('/login'); }}>Login</Button>
      <Button variant="contained" onClick={() => { navigate('/signup'); }}>Sign up</Button>
    </div>
  );
}
