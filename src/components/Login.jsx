import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('username: ', username);
  };

  return (
    <div>
      <h1>This is the Login page</h1>
      <form autoComplete="off" onSubmit={handleSubmit}>
        <label htmlFor="username">
          Username
          <input
            name="username"
            value={username}
            type="text"
            required
            onChange={(e) => { setUsername(e.target.value); }}
          />
        </label>
        <label htmlFor="password">
          Password
          <input
            name="password"
            value={password}
            type="password"
            required
            onChange={(e) => { setPassword(e.target.value); }}
          />
        </label>
        <input type="submit" value="Sign In" />
      </form>
      <p>Don't have an account? Sign up!</p>
      <button type="button" onClick={() => { navigate('/signup'); }}>Sign up</button>
    </div>
  );
}
