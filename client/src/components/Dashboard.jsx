import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '@chakra-ui/react';

export default function Dashboard({ username, setUser, setPlanToJoin, setEmail }) {
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
    setEmail(null);
    setPlanToJoin(null);
    navigate('/');
  };

  return (
    <div>
      <Button onClick={logUserOut}>Log Out</Button>
      <h1>
        {username}
        &apos;s Dashboard
      </h1>
      <Button onClick={() => { navigate('/plan/create'); }}>Create a New Plan</Button>
      <Button onClick={() => { navigate('/plan/all'); }}>Your Current Plans</Button>
      <Button onClick={() => { setShowCodeInput(true); }}>Have a Code? Join a Plan!</Button>
      <div>
        {showCodeInput && (
        <form onSubmit={codeInputSubmit}>
          <Input
            type="text"
            label="Plan Code"
            placeholder="Plan Code"
            value={code}
            required
            variant="outlined"
            onChange={(e) => { setCode(e.target.value); }}
          />
          <Button type="submit">Join!</Button>
        </form>
        )}
      </div>
    </div>
  );
}
