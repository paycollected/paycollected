import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { useForm } from 'react-hook-form';
import {
  Button, Input, FormControl, FormLabel, FormErrorMessage
} from '@chakra-ui/react';
import { CreateUser as SIGN_UP } from '../graphql/mutations.gql';

export default function Signup({ setUser, planToJoin }) {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [errorMessage, setErrorMessage] = useState('');

  const [signup, { data, loading, error }] = useMutation(SIGN_UP, {
    onCompleted: ({ createUser }) => {
      const { username, token } = createUser;
      localStorage.setItem('token', token);
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
        <FormControl
          isRequired
          isInvalid={errors.firstName}
        >
          <FormLabel>First Name</FormLabel>
          <Input
            name="firstName"
            placeholder="Enter First Name"
            type="text"
            {...register('firstName', { required: 'First name required' })}
          />
          {errors.firstName ? (
            <div>
              <FormErrorMessage>
                {errors.firstName.message}
              </FormErrorMessage>
            </div>
          ) : (
            <div>&nbsp;</div>
          )}
        </FormControl>
        <FormControl
          isRequired
          isInvalid={errors.lastName}
        >
          <FormLabel>Last Name</FormLabel>
          <Input
            name="lastName"
            placeholder="Enter Last Name"
            type="text"
            {...register('lastName', { required: 'Last name required' })}
          />
          {errors.lastName ? (
            <div>
              <FormErrorMessage>
                {errors.lastName.message}
              </FormErrorMessage>
            </div>
          ) : (
            <div>&nbsp;</div>
          )}
        </FormControl>
        <FormControl
          isRequired
          isInvalid={errors.username  || errorMessage === 'Username already exists'}
        >
          <FormLabel>Username</FormLabel>
          <Input
            name="username"
            placeholder="Enter Username"
            type="text"
            {...register('username', { required: 'Username required' })}
          />
          {errors.username ? (
            <div>
              <FormErrorMessage>
                {errors.username.message}
              </FormErrorMessage>
            </div>
          ) : (
            <div>&nbsp;</div>
          )}
        </FormControl>
        <FormControl
          isRequired
          isInvalid={errors.password || errorMessage === 'Passwords must match'}
        >
          <Input
            name="password"
            placeholder="Enter Password"
            type="password"
            {...register('password', { required: 'Password required' })}
          />
          {errors.password ? (
            <div>
              <FormErrorMessage>
                {errors.password.message}
              </FormErrorMessage>
            </div>
          ) : (
            <div>&nbsp;</div>
          )}
        </FormControl>

        <Input
          name="password2"
          placeholder="Confirm Password"
          required
          type="password"
          {...register('password2', { required: 'Enter password again' })}
          error={!!errors?.password2}
          helperText={errors?.password2 ? errors.password2.message : ' '}
        />
        <Input
          name="email"
          placeholder="Enter Email"
          required
          type="email"
          {...register('email', { required: 'Email required' })}
          error={!!errors?.email}
          helperText={errors?.email ? errors.email.message : ' '}
        />
        {errorMessage.length > 0 ? (
          <div>{errorMessage}</div>
        ) : (
          <div>&nbsp;</div>
        )}
        <Button type="submit" isLoading={loading}>Join</Button>
      </form>
    </div>
  );
}
