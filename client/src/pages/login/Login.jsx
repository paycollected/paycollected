import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { useForm } from 'react-hook-form';
import {
  Button, Input, InputGroup, InputRightElement,
  FormControl, FormLabel, FormErrorMessage,
  Box, Heading, Flex, useDisclosure,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import ReverifyEmail from './ReverifyEmail.jsx';
import ForgotPwd from './ForgotPwd.jsx';
import { LogIn as LOG_IN } from '../../graphql/mutations.gql';

export default function Login({ setUser, planToJoin }) {
  const navigate = useNavigate();
  const { isOpen: isOpenVerify, onOpen: onOpenVerify, onClose: onCloseVerify } = useDisclosure();
  const { isOpen: isOpenReset, onOpen: onOpenReset, onClose: onCloseReset } = useDisclosure();
  const { register, handleSubmit, formState: { errors } } = useForm();
  // if login info is valid
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [logUserIn, { loading }] = useMutation(LOG_IN, {
    onCompleted: ({ login }) => {
      // login = token returned; null if passwords do not match
      if (login) {
        const { username, token } = login;
        localStorage.setItem('token', token);
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
        case 'This account does not exist':
          setErrorMessage(message);
          break;
        case 'Unable to log in':
          setErrorMessage('Please try logging in later');
          break;
        case 'The email associated with this account has not been verified yet.':
          setErrorMessage(message);
          break;
        default:
          setErrorMessage('');
          console.log('login error: ', message);
          break;
      }
    },
  });


  const onSubmit = ({ usernameOrEmail, password }) => {
    logUserIn({
      variables: {
        usernameOrEmail,
        password,
      },
    });
  };

  return (
    <div>
      <ReverifyEmail isOpen={isOpenVerify} onClose={onCloseVerify} />
      <ForgotPwd isOpen={isOpenReset} onClose={onCloseReset} />
      <Flex width="full" align="center" justifyContent="center">
        <Box p={2} my={8} width="40%" bg="white" borderRadius="15">
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
                isInvalid={errors.usernameOrEmail || errorMessage === 'Incorrect username and password'}
              >
                <FormLabel>Username or Email</FormLabel>
                <Input
                  name="usernameOrEmail"
                  placeholder="Enter Username or Email"
                  type="text"
                  {...register('usernameOrEmail', { required: 'Username or email required' })}
                />
                {errors.usernameOrEmail ? (
                  <FormErrorMessage>
                    {errors.usernameOrEmail.message}
                  </FormErrorMessage>
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
                  <FormErrorMessage>
                    {errors.password.message}
                  </FormErrorMessage>
                ) : (
                  <div>&nbsp;</div>
                )}
              </FormControl>
              <FormControl isInvalid={errorMessage.length > 0}>
                {errorMessage.length > 0 ? (
                  <FormErrorMessage>{errorMessage}</FormErrorMessage>
                ) : (
                  <div>&nbsp;</div>
                )}
              </FormControl>
              <Button type="submit" isLoading={loading} disabled={loading}>Sign in</Button>
            </form>
            <p>Don&apos;t have an account? Sign up!</p>
            <Button onClick={() => { navigate('/signup'); }}>Sign up</Button>
            <Button onClick={() => { navigate('/'); }}>Cancel</Button>
            <button type="button" onClick={onOpenReset}>Forgot your password?</button>
            <button type="button" onClick={onOpenVerify}>Still need to verify your email?</button>
          </Box>
        </Box>
      </Flex>
    </div>
  );
}
