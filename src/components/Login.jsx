import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gql, useMutation, useLazyQuery } from '@apollo/client';

export default function Login({ setUser }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const LOG_IN = gql`
    mutation ($username: String!, $password: String!) {
      login(username: $username, password: $password)
    }
  `;
  const HELLO = gql`
    query {
      hello
    }
  `;

  const [logUserIn, { data: loginData, loading, error: loginError }] = useMutation(LOG_IN, {
    onCompleted: ({ login }) => {
      localStorage.setItem('token', login);
      localStorage.setItem('username', username);
      setUser(username);
      navigate('/dashboard');
    },
    onError: ({ message }) => {
      localStorage.clear();
      console.log('login error in onError: ', message);
      /* TO-DO: handle UI error later
      message = 'This username does not exist' --> display message to ask user to verify username
      message = 'Unable to log in' --> server error: display message to try again later

      switch(message) {
        case 'This username does not exist':
          // handle later
          break;
        default:
      }
      */
    },
  });
  const [helloQuery, { data: helloData, error: helloError }] = useLazyQuery(HELLO);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('username: ', username);
    logUserIn({
      variables: {
        username,
        password,
      },
    });
  };

  // if (loginData) {
  //   console.log('loginData received: ', loginData);
  //   // data here will be token
  //   localStorage.setItem('token', loginData.login);
  // }

  const testQuery = () => {
    helloQuery();
  };

  if (helloData) {
    console.log('helloData received: ', helloData);
  }

  if (helloError) {
    console.log('helloError: ', helloError);
  }

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
      <p>Don&apos;t have an account? Sign up!</p>
      <button type="button" onClick={() => { navigate('/signup'); }}>Sign up</button>
      <button type="button" onClick={testQuery}>Test Query Authentication</button>
    </div>
  );
}
