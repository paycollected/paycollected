import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gql, useMutation } from '@apollo/client';

export default function Signup({ setUser, planToJoin }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [email, setEmail] = useState('');
  const [usernameTaken, setUsernameTaken] = useState(false);
  const [passwordMismatch, setPasswordMismatch] = useState(false);

  const SIGN_UP = gql`
    mutation ($firstName: String!, $lastName: String!, $username: String!, $password: String!, $email: String!) {
      createUser(firstName: $firstName, lastName: $lastName, username: $username, password: $password, email: $email) {
        username
        token
      }
    }
  `;

  const [signup, { data, loading, error }] = useMutation(SIGN_UP, {
    onCompleted: ({ createUser }) => {
      localStorage.setItem('token', createUser.token);
      localStorage.setItem('username', createUser.username);
      setUser(createUser.username);
      if (!planToJoin) {
        navigate('/dashboard');
      } else {
        navigate(`/join/${planToJoin}`);
      }
    },
    onError: ({ message }) => {
      console.log('create user error: ', message);
      /* TO-DO: handle UI error later
      message = 'This username already exists'
      message = 'This email already exists'
      message = 'Unable to create user' --> try again later

      switch(message) {
        case 'This username already exists':
          // handle later
          break;
        case 'This email already exists':
          // handle later
          break;
        default:
      }
      */
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== password2) {
      console.log('passwords dont match');
      setPasswordMismatch(true);
    } else {
      setPasswordMismatch(false);
      signup({
        variables: {
          firstName, lastName, username, password, email,
        },
      });
    }
  };

  return (
    <div>
      <h1>This is the Signup page</h1>
      <form autoComplete="off" onSubmit={handleSubmit}>
        <label htmlFor="firstName">
          First Name
          <input
            name="firstName"
            value={firstName}
            type="text"
            required
            onChange={(e) => { setFirstName(e.target.value); }}
          />
        </label>
        <label htmlFor="lastName">
          Last Name
          <input
            name="lastName"
            value={lastName}
            type="text"
            required
            onChange={(e) => { setLastName(e.target.value); }}
          />
        </label>
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
