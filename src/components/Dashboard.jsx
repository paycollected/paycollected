import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard({ username, setUser }) {
  const navigate = useNavigate();
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [code, setCode] = useState('');
  const codeInputSubmit = (e) => {
    e.preventDefault();
    navigate(`/join/${code}`);
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          localStorage.clear();
          setUser(null);
        }}
      >
        Log Out
      </button>
      <h1>
        {username}
        &apos;s Dashboard
      </h1>
      <button type="button" onClick={() => { navigate('/plan/create'); }}>Create a New Plan</button>
      <button type="button" onClick={() => { navigate('/plan/all'); }}>Your Current Plans</button>
      <button type="button" onClick={() => { setShowCodeInput(true); }}>Have a Code? Join a Plan!</button>
      {showCodeInput && (
        <form onSubmit={codeInputSubmit}>
          <input type="text" placeholder="Plan Code" value={code} onChange={(e) => { setCode(e.target.value); }} />
          <input type="submit" value="Join!" />
        </form>
      )}
    </div>
  );
}
