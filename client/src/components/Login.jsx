import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { useForm } from 'react-hook-form';
import {
  Button, Input, InputGroup, InputRightElement,
  FormControl, FormLabel, FormErrorMessage,
  Box, Heading, Flex, useDisclosure, Modal, ModalOverlay,
  ModalContent, ModalHeader, ModalBody, ModalFooter
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { LogIn as LOG_IN, ResendVerificationEmail as REVERIFY } from '../graphql/mutations.gql';

export default function Login({ setUser, planToJoin }) {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const {
    register: registerReverify,
    handleSubmit: handleSubmitReverify,
    formState: { errors: reverifyErrors }
  } = useForm();
  // if login info is valid
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
  const [email, setEmail] = useState('');
  const [verificationError, setVerificationError] = useState('');

  const [logUserIn, { loading: signInLoading }] = useMutation(LOG_IN, {
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
        case 'Account exists but email still needs verification':
          setErrorMessage(message);
          break;
        default:
          setErrorMessage('');
          console.log('login error: ', message);
          break;
      }
    },
  });

  const [reverify, { loading }] = useMutation(REVERIFY, {
    onCompleted: () => {
      setVerificationEmailSent(true);
    },
    onError: ({ message }) => {
      switch (message) {
        case 'No account associated with this email was found.':
          setVerificationError(message);
          break;
        case 'This email has already been verified.':
          setVerificationError(message);
          break;
        default:
          console.log(message);
      }
    },
  });

  const onSubmitLogIn = ({ usernameOrEmail, password }) => {
    logUserIn({
      variables: {
        usernameOrEmail,
        password,
      },
    });
  };

  const onSubmitReverify = ({ reverifyEmail }) => {
    setEmail(reverifyEmail);
    reverify({ variables: { email: reverifyEmail } });
  };

  return (
    <div>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Resend Your Verification Email</ModalHeader>
          <ModalBody>
            {!verificationEmailSent && !verificationError && (
              <form onSubmit={handleSubmitReverify(onSubmitReverify)}>
                <FormControl>
                  <FormLabel>Email</FormLabel>
                  <Input
                    {...registerReverify('reverifyEmail', { required: 'Missing email'})}
                    type="email"
                  />
                </FormControl>
                <Button type="submit">Submit</Button>
              </form>
            )}
            {verificationEmailSent && (
              <div>{`We've sent a verification email to ${email}. Please check your inbox for instructions.`}</div>
            )}
            {verificationError && (<div>{verificationError}</div>)}
          </ModalBody>
          <ModalFooter>
            <Button
              onClick={() => {
                setVerificationEmailSent(false);
                setVerificationError('');
                onClose();
              }}
            >
              Back
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Flex width="full" align="center" justifyContent="center">
        <Box p={2} my={8} width="40%" bg="white" borderRadius="15">
          <Box textAlign="center">
            <Heading>Login</Heading>
          </Box>
          <Box my={4} textAlign="left">
            <form
              autoComplete="off"
              onSubmit={handleSubmit(onSubmitLogIn)}
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
              <Button type="submit" isLoading={signInLoading} disabled={signInLoading}>Sign in</Button>
            </form>
            <p>Don&apos;t have an account? Sign up!</p>
            <Button onClick={() => { navigate('/signup'); }}>Sign up</Button>
            <Button onClick={() => { navigate('/'); }}>Cancel</Button>
            <button type="button" onClick={onOpen}>Still need to verify your email?</button>
          </Box>
        </Box>
      </Flex>
    </div>
  );
}
