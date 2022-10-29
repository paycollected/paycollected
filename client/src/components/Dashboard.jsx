import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button, FormControl, FormLabel, Input, Heading
} from '@chakra-ui/react';

// actual redirect URL string 'http://localhost:5647/dashboard/?setup_intent=seti_1Lq9rqAJ5Ik974ueIdg7WHn9&setup_intent_client_secret=seti_1Lq9rqAJ5Ik974ueIdg7WHn9_secret_MZISJyXsMF6na4pA6ryaqOfvt8JbeGa&redirect_status=succeeded'

export default function Dashboard({ username, setUser, setPlanToJoin }) {
  const navigate = useNavigate();
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [code, setCode] = useState('');

  useEffect(() => {
    const queryStr = window.location.search;
    if (queryStr.length > 0) {
      const urlParams = new URLSearchParams(queryStr);
      if (urlParams.get('redirect_status') === 'succeeded') {
        // console.log('I got to here');
        // display some notification indicating successful payment
      }
    }
  }, []);

  const codeInputSubmit = (e) => {
    e.preventDefault();
    const formattedCode = code.toString().trim();
    setCode(formattedCode);
    navigate(`/join/${formattedCode}`);
  };

  return (
    <div>
      <Heading>
        {username}
        &apos;s Dashboard
      </Heading>
      <Button onClick={() => { navigate('/plan/create'); }}>Create a New Plan</Button>
      <Button onClick={() => { navigate('/plan/all'); }}>Your Current Plans</Button>
      <Button onClick={() => { setShowCodeInput(true); }}>Have a Code? Join a Plan!</Button>
      <div>
        {showCodeInput && (
        <div>
          <form onSubmit={codeInputSubmit}>
            <FormControl
              isRequired
              my={2}
            >
              <FormLabel>Plan Code</FormLabel>
              <Input
                type="text"
                width="50%"
                bg="white"
                placeholder="Enter Code"
                value={code}
                onChange={(e) => { setCode(e.target.value); }}
              />
            </FormControl>
            <Button type="submit">Join!</Button>
            <Button onClick={() => { setShowCodeInput(false); }}>Cancel</Button>
          </form>
        </div>
        )}
      </div>
    </div>
  );
}
