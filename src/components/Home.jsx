import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div>
      <h1>This is the Home page</h1>
      <button type="button" onClick={() => { navigate('/login'); }}>Login</button>
      <button type="button" onClick={() => { navigate('/signup'); }}>Sign up</button>
    </div>
  );
}
