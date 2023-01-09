import React, { useState } from 'react';
import { useNavigate, Link as ReactLink } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { useForm } from 'react-hook-form';
import {
  Button, Input, InputGroup, InputRightElement, Image, Link,
  FormControl, FormLabel, FormErrorMessage, IconButton,
  Container, Box, Stack, HStack, Text, Heading, useDisclosure, useBreakpointValue, useColorModeValue
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import ReverifyEmailModal from './ReverifyEmailModal.jsx';
import ForgotPwdModal from './ForgotPwdModal.jsx';
import Logo from '../../public/Pay_Collected_Logo.png';
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
          setErrorMessage('See console for login error');
          console.log('login error: ', message);
          break;
      }
      console.log('error');
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
    <>
      <ReverifyEmailModal isOpen={isOpenVerify} onClose={onCloseVerify} />
      <ForgotPwdModal isOpen={isOpenReset} onClose={onCloseReset} />
      <Container maxW="lg" py={{ base: '12', md: '24' }} px={{ base: '0', sm: '8' }}>
        <Stack spacing="8">
          <form
            autoComplete="off"
            onSubmit={handleSubmit(onSubmit)}
          >
            <Stack spacing="6" align="center" pb={8}>
              <Link as={ReactLink} to="/">
                <Image src={Logo} alt="Pay Collected Logo" fit="cover" htmlWidth="200px" loading="eager" />
              </Link>
              <Stack spacing={{ base: '2', md: '3' }} textAlign="center">
                <Heading size="lg" color="black">
                  Log in to your account
                </Heading>
                <HStack spacing="2" justify="center">
                  <Text color="muted">Don&apos;t have an account?</Text>
                  <Button variant="link" fontWeight="normal" colorScheme="blue" onClick={() => { navigate('/create-account'); }}>
                    Sign up
                  </Button>
                </HStack>
              </Stack>
            </Stack>
            <Box
              py={{ base: '0', sm: '12' }}
              px={{ base: '4', sm: '10' }}
              bg={useBreakpointValue({ base: 'transparent', sm: 'bg-surface' })}
              border="1px solid #DFDFDF"
              borderRadius={{ base: 'none', sm: 'xl' }}
            >
              <Stack spacing="2">
                <Stack spacing="2">
                  <FormControl
                    isRequired
                    isInvalid={errors.usernameOrEmail || errorMessage === 'Incorrect username and password'}
                  >
                    <FormLabel htmlFor="usernameOrEmail" textStyle="formLabel" fontWeight={600}>Username or Email</FormLabel>
                    <Input
                      name="usernameOrEmail"
                      type="text"
                      autoFocus
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
                    <FormLabel htmlFor="password" textStyle="formLabel" fontWeight={600}>Password</FormLabel>
                    <InputGroup>
                      <Input
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        {...register('password', {
                          required: 'Password required',
                          minLength: { value: 3, message: 'Password must be at least 3 characters' }
                        })}
                      />
                      <InputRightElement>
                        <IconButton
                          variant="link"
                          icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                          onClick={() => setShowPassword(!showPassword)}
                        />
                      </InputRightElement>
                    </InputGroup>
                    {errors.password ? (
                      <FormErrorMessage>
                        {errors.password.message}
                      </FormErrorMessage>
                    ) : (
                      <div>&nbsp;</div>
                    )}
                    <FormControl isInvalid={errorMessage.length > 0} mt="-2">
                      {errorMessage.length > 0 ? (
                        <FormErrorMessage>{errorMessage}</FormErrorMessage>
                      ) : (
                        <div>&nbsp;</div>
                      )}
                    </FormControl>
                  </FormControl>
                </Stack>
                <HStack justify="space-between" pb={6}>
                  <Button variant="link" fontWeight="normal" colorScheme="blue" size="sm" onClick={onOpenVerify}>
                    Reverify Email
                  </Button>
                  <Button variant="link" fontWeight="normal" colorScheme="blue" size="sm" onClick={onOpenReset}>
                    Forgot password?
                  </Button>
                </HStack>
                <Stack spacing="6">
                  <Button
                    type="submit"
                    bg="#272088"
                    onClick={() => handleSubmit(onSubmit)}
                    isLoading={loading}
                    disabled={loading}
                  >
                    Sign in
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </form>
        </Stack>
      </Container>
    </>
  );
}
