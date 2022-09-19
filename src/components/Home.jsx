import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div>
      <h1>This is the Home page</h1>
      <Button variant="contained" onClick={() => { navigate('/login'); }}>Login</Button>
      <Button variant="contained" onClick={() => { navigate('/signup'); }}>Sign up</Button>
    </div>
  );
}
