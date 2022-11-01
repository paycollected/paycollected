import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { useForm } from 'react-hook-form';
import {
  Flex, Box, Heading, Button, Input, FormControl, FormLabel, FormErrorMessage
} from '@chakra-ui/react';
import { CreateUser as SIGN_UP } from '../graphql/mutations.gql';

export default function Signup({ setUser, planToJoin }) {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [errorMessage, setErrorMessage] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const [signup, { data, loading, error }] = useMutation(SIGN_UP, {
    onCompleted: () => { setEmailSent(true); },
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
      {emailSent && (
        <div>
          {`We've sent an email to the provided address.
          Please check your inbox and follow the instructions to complete the sign up process!`}
        </div>
      )}
      <Flex width="full" align="center" justifyContent="center">
        <Box p={2} my={8} width="60%" bg="white" borderRadius="15">
          <Box textAlign="center">
            <Heading>Sign Up</Heading>
          </Box>
          <Box my={4} textAlign="left">
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
                  <FormErrorMessage>
                    {errors.firstName.message}
                  </FormErrorMessage>
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
                  <FormErrorMessage>
                    {errors.lastName.message}
                  </FormErrorMessage>
                ) : (
                  <div>&nbsp;</div>
                )}
              </FormControl>
              <FormControl
                isRequired
                isInvalid={errors.username || errorMessage === 'Username already exists'}
              >
                <FormLabel>Username</FormLabel>
                <Input
                  name="username"
                  placeholder="Enter Username"
                  type="text"
                  {...register('username', { required: 'Username required' })}
                />
                {errors.username ? (
                  <FormErrorMessage>
                    {errors.username.message}
                  </FormErrorMessage>
                ) : (
                  <div>&nbsp;</div>
                )}
              </FormControl>
              <FormControl
                isRequired
                isInvalid={errors.password || errorMessage === 'Passwords must match'}
              >
                <FormLabel>Password</FormLabel>
                <Input
                  name="password"
                  placeholder="Enter Password"
                  type="password"
                  {...register('password', { required: 'Password required' })}
                />
                {errors.password ? (
                  <FormErrorMessage>
                    {errors.password.message}
                  </FormErrorMessage>
                ) : (
                  <div>&nbsp;</div>
                )}
              </FormControl>
              <FormControl
                isRequired
                isInvalid={errors.password2 || errorMessage === 'Passwords must match'}
              >
                <FormLabel>Confirm Password</FormLabel>
                <Input
                  name="password2"
                  placeholder="Enter Password Again"
                  type="password"
                  {...register('password2', { required: 'Please enter password again' })}
                />
                {errors.password2 ? (
                  <FormErrorMessage>
                    {errors.password2.message}
                  </FormErrorMessage>
                ) : (
                  <div>&nbsp;</div>
                )}
              </FormControl>
              <FormControl
                isRequired
                isInvalid={errors.email || errorMessage === 'Email already exists'}
              >
                <FormLabel>Email</FormLabel>
                <Input
                  name="email"
                  placeholder="Enter Email"
                  type="email"
                  {...register('email', { required: 'Email required' })}
                />
                {errorMessage.length > 0 ? (
                  <div>{errorMessage}</div>
                ) : (
                  <div>&nbsp;</div>
                )}

              </FormControl>
              <Button type="submit" isLoading={loading}>Join</Button>
              <Button onClick={() => { navigate('/'); }}>Cancel</Button>
            </form>
          </Box>
        </Box>
      </Flex>
    </div>
  );
}
