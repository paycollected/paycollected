import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { useForm } from 'react-hook-form';
import {
  Button, Input, InputGroup, InputRightElement,
  FormControl, FormLabel, FormErrorMessage,
  Box, Heading, Flex
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
    <Flex width="full" align="center" justifyContent="center">
      <Box p={2} my={8} width="40%">
        <Box textAlign="center">
          <Heading>Login</Heading>
        </Box>
        <Box my={4} textAlign="left">
          <form
            autoComplete="off"
            onSubmit={handleSubmit(onSubmit)}
          >
            <FormControl
              isRequired
              isInvalid={errors.username || errorMessage === 'Please verify username' || errorMessage === 'Incorrect username and password'}
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
                    {errors.username && errors.username.message}
                  </FormErrorMessage>
                </div>
              ) : (
                <div>&nbsp;</div>
              )}
            </FormControl>
            <FormControl
              isRequired
              isInvalid={errors.password || errorMessage === 'Incorrect username and password'}
            >
              <FormLabel>Password</FormLabel>
              <InputGroup>
                <Input
                  name="password"
                  placeholder="Enter password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: 'Password required',
                    minLength: { value: 3, message: 'Password must be at least 3 characters' }
                  })}
                />
                <InputRightElement>
                  <Button onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <ViewIcon /> : <ViewOffIcon />}
                  </Button>
                </InputRightElement>
              </InputGroup>
              {errors.password ? (
                <div>
                  <FormErrorMessage>
                    {errors.password && errors.password.message}
                  </FormErrorMessage>
                </div>
              ) : (
                <div>&nbsp;</div>
              )}
            </FormControl>
            {errorMessage.length > 0 ? (
              <div>{errorMessage}</div>
            ) : (
              <div>&nbsp;</div>
            )}
            <Button type="submit" isLoading={loading}>Sign in</Button>
          </form>
          <p>Don&apos;t have an account? Sign up!</p>
          <Button onClick={() => { navigate('/signup'); }}>Sign up</Button>
          <Button onClick={() => { navigate('/'); }}>Cancel</Button>
        </Box>
      </Box>
    </Flex>
  );
}
