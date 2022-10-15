import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { useForm } from 'react-hook-form';
import {
  Button, Input, InputGroup, InputRightElement
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { LogIn as LOG_IN } from '../graphql/mutations.gql';

export default function Login({ setUser, planToJoin }) {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();
  // if login info is valid
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [logUserIn, { loading }] = useMutation(LOG_IN, {
    onCompleted: ({ login }) => {
      // login = token returned; null if passwords do not match
      if (login) {
        const { username, email, token } = login;
        localStorage.setItem('token', token);
        localStorage.setItem('username', username); // need access to username
        localStorage.setItem('email', email);
        setErrorMessage('');
        setUser(username); // need access to username
        if (!planToJoin) {
          navigate('/dashboard');
        } else {
          navigate(`/join/${planToJoin}`);
        }
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

  const onSubmit = ({ username, password }) => {
    logUserIn({
      variables: {
        username,
        password,
      },
    });
  };

  return (
    <div>
      <h1>This is the Login page</h1>
      <form
        autoComplete="off"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Input
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
        <InputGroup>
          <Input
            name="password"
            label="Password"
            required
            type={showPassword ? 'text' : 'password'}
            variant="outlined"
            defaultValue=""
            {...register('password', { required: 'Password required' })}
            error={!!errors?.password}
            helperText={errors?.password ? errors.password.message : ' '}
          />
          <InputRightElement>
            <Button onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <ViewIcon /> : <ViewOffIcon />}
            </Button>
          </InputRightElement>
        </InputGroup>
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
    </div>
  );
}
