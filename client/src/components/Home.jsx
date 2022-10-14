import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@chakra-ui/react';

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
      <Button variant="outline" onClick={() => { navigate('/login'); }}>Login</Button>
      <Button variant="outline" onClick={() => { navigate('/signup'); }}>Sign up</Button>
    </div>
  );
}
