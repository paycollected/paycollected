import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

export default function Dashboard({ username, setUser, setPlanToJoin }) {
  const navigate = useNavigate();
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [code, setCode] = useState('');

  const codeInputSubmit = (e) => {
    e.preventDefault();
    const formattedCode = code.toString().trim();
    setCode(formattedCode);
    navigate(`/join/${formattedCode}`);
  };

  const logUserOut = () => {
    localStorage.clear();
    setUser(null);
    setPlanToJoin(null);
    navigate('/');
  };

  return (
    <div>
      <Button variant="contained" onClick={logUserOut}>Log Out</Button>
      <h1>
        {username}
        &apos;s Dashboard
      </h1>
      <Button variant="contained" onClick={() => { navigate('/plan/create'); }}>Create a New Plan</Button>
      <Button variant="contained" onClick={() => { navigate('/plan/all'); }}>Your Current Plans</Button>
      <Button variant="contained" onClick={() => { setShowCodeInput(true); }}>Have a Code? Join a Plan!</Button>
      <div>
        {showCodeInput && (
        <form onSubmit={codeInputSubmit}>
          <TextField
            type="text"
            label="Plan Code"
            placeholder="Plan Code"
            value={code}
            required
            variant="outlined"
            onChange={(e) => { setCode(e.target.value); }}
          />
          <Button variant="contained" type="submit">Join!</Button>
        </form>
        )}
      </div>
    </div>
  );
}
