import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gql, useMutation, useLazyQuery } from '@apollo/client';
import { useForm } from 'react-hook-form';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import TextField from '@mui/material/TextField';

export default function Login({ setUser }) {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();
  // if login info is valid
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const LOG_IN = gql`
    mutation ($username: String!, $password: String!) {
      login(username: $username, password: $password) {
        username
        token
      }
    }
  `;
  const HELLO = gql`
    query {
      hello
    }
  `;

  const [logUserIn, { data: loginData, loading, error: loginError }] = useMutation(LOG_IN, {
    onCompleted: ({ login }) => {
      // login = token returned; null if passwords do not match
      if (login) {
        localStorage.setItem('token', login.token);
        localStorage.setItem('username', login.username); // need access to username
        setErrorMessage('');
        setUser(login.username); // need access to username
        navigate('/dashboard');
      } else {
        setErrorMessage('Incorrect username and password');
        setUser(null);
      }
    },
    onError: ({ message }) => {
      localStorage.clear();
      setUser(null);
      switch (message) {
        case 'This username does not exist':
          setErrorMessage('Please verify username');
          break;
        case 'Unable to log in':
          setErrorMessage('Please try logging in later');
          break;
        default:
          setErrorMessage('');
          console.log('login error: ', message);
          break;
      }
    },
  });
  const [helloQuery, { data: helloData, error: helloError }] = useLazyQuery(HELLO);

  const onSubmit = ({ username, password }) => {
    logUserIn({
      variables: {
        username,
        password,
      },
    });
  };

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
      <form
        autoComplete="off"
        onSubmit={handleSubmit(onSubmit)}
      >
        <TextField
          name="username"
          label="Username"
          required
          type="text"
          variant="outlined"
          defaultValue=""
          {...register('username', { required: 'Username required' })}
          error={!!errors?.username}
          helperText={errors?.username ? errors.username.message : ' '}
        />
        <TextField
          name="password"
          label="Password"
          required
          type={showPassword ? 'text' : 'password'}
          variant="outlined"
          defaultValue=""
          {...register('password', { required: 'Password required' })}
          error={!!errors?.password}
          helperText={errors?.password ? errors.password.message : ' '}
          InputProps={{
            endAdornment:
            (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => {
                    setShowPassword(!showPassword);
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        {errorMessage.length > 0 ? (
          <div>{errorMessage}</div>
        ) : (
          <div>&nbsp;</div>
        )}
        <Button type="submit" variant="contained" disabled={loading}>Sign in</Button>
      </form>
      <p>Don&apos;t have an account? Sign up!</p>
      <Button variant="contained" onClick={() => { navigate('/signup'); }}>Sign up</Button>
      <Button variant="contained" onClick={() => { navigate('/home'); }}>Cancel</Button>
      <button type="button" onClick={testQuery}>Test Query Authentication</button>
    </div>
  );
}
