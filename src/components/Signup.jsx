import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Signup() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [email, setEmail] = useState('');
  const [usernameTaken, setUsernameTaken] = useState(false);
  const [passwordMismatch, setPasswordMismatch] = useState(false);

  const handleSubmit = (e) => {
    /*
    1) check if username already exists
    2) password1 = password2
    */
    e.preventDefault();
    console.log('email: ', email);
    if (password !== password2) {
      setPasswordMismatch(true);
    }
    // if successful, navigate to dashboard
    navigate('/dashboard');
  };

  return (
    <div>
      <h1>This is the Signup page</h1>
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
        <label htmlFor="password2">
          Confirm Password:
          <input
            name="password2"
            value={password2}
            type="password"
            required
            onChange={(e) => { setPassword2(e.target.value); }}
          />
        </label>
        <label htmlFor="email">
          Email
          <input
            name="email"
            value={email}
            type="email"
            required
            onChange={(e) => { setEmail(e.target.value); }}
          />
        </label>
        <button type="submit">Join</button>
      </form>
    </div>
  );
}
