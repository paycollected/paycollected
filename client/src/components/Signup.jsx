import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { useForm } from 'react-hook-form';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { CreateUser as SIGN_UP } from '../graphql/mutations.gql';

export default function Signup({ setUser, planToJoin }) {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [errorMessage, setErrorMessage] = useState('');

  const [signup, { data, loading, error }] = useMutation(SIGN_UP, {
    onCompleted: ({ createUser }) => {
      const { username, email, token } = createUser;
      localStorage.setItem('token', token);
      localStorage.setItem('username', username);
      localStorage.setItem('email', email);
      setUser(username);
      setErrorMessage('');
      if (!planToJoin) {
        navigate('/dashboard');
      } else {
        navigate(`/join/${planToJoin}`);
      }
    },
    onError: ({ message }) => {
      localStorage.clear();
      setUser(null);
      switch (message) {
        case 'This username already exists':
          setErrorMessage('Username already exists');
          break;
        case 'This email already exists':
          setErrorMessage('Email already exists');
          break;
        case 'Unable to create user':
          setErrorMessage('Please try signing up later');
          break;
        default:
          setErrorMessage('');
          console.log('create user error: ', message);
          break;
      }
    },
  });

  const onSubmit = ({
    firstName, lastName, username, password, password2, email,
  }) => {
    if (password !== password2) {
      setErrorMessage('Passwords must match');
    } else {
      setErrorMessage('');
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
      <form
        autoComplete="off"
        onSubmit={handleSubmit(onSubmit)}
      >
        <TextField
          name="firstName"
          label="First Name"
          required
          type="text"
          variant="outlined"
          defaultValue=""
          {...register('firstName', { required: 'First name required' })}
          error={!!errors?.firstName}
          helperText={errors?.firstName ? errors.firstName.message : ' '}
        />
        <TextField
          name="lastName"
          label="Last Name"
          required
          type="text"
          variant="outlined"
          defaultValue=""
          {...register('lastName', { required: 'Last name required' })}
          error={!!errors?.lastName}
          helperText={errors?.lastName ? errors.lastName.message : ' '}
        />
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
          type="password"
          variant="outlined"
          defaultValue=""
          {...register('password', { required: 'Password required' })}
          error={!!errors?.password}
          helperText={errors?.password ? errors.password.message : ' '}
        />
        <TextField
          name="password2"
          label="Confirm Password"
          required
          type="password"
          variant="outlined"
          defaultValue=""
          {...register('password2', { required: 'Enter password again' })}
          error={!!errors?.password2}
          helperText={errors?.password2 ? errors.password2.message : ' '}
        />
        <TextField
          name="email"
          label="Email"
          required
          type="email"
          variant="outlined"
          defaultValue=""
          {...register('email', { required: 'Email required' })}
          error={!!errors?.email}
          helperText={errors?.email ? errors.email.message : ' '}
        />
        {errorMessage.length > 0 ? (
          <div>{errorMessage}</div>
        ) : (
          <div>&nbsp;</div>
        )}
        <Button type="submit" variant="contained" disabled={loading}>Join</Button>
      </form>
    </div>
  );
}
