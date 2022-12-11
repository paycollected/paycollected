import React, { useState } from 'react';
import { useNavigate, Link as ReactLink } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { useForm } from 'react-hook-form';
import {
  Box, Heading, Button, Input, InputGroup, FormControl, FormLabel, FormErrorMessage,
  Container, Stack, HStack, Text, Link, Image, IconButton, InputRightElement,
  useBreakpointValue, useColorModeValue, useDisclosure
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import Logo from '../../public/Pay_Collected_Logo.png';
import EmailSentModal from './EmailSentModal.jsx';
import { CreateUser as SIGN_UP } from '../../graphql/mutations.gql';

export default function CreateAccount({ setUser }) {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [errorMessage, setErrorMessage] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  const [signup, { loading }] = useMutation(SIGN_UP, {
    onCompleted: () => {
      setErrorMessage('');
      onOpen();
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
          setErrorMessage('See console for signup error');
          console.log('create user error: ', message);
          break;
      }
    },
  });

  const onSubmit = ({
    fullName, username, password, password2, email: inputEmail,
  }) => {
    if (password !== password2) {
      setErrorMessage('Passwords must match');
    } else {
      const [firstName, lastName] = fullName.split(' ');
      if (!lastName) {
        setErrorMessage('Please enter first and last name');
      } else {
        setErrorMessage('');
        setEmail(inputEmail);
        signup({
          variables: {
            firstName, lastName, username, password, email: inputEmail,
          },
        });
      }
    }
  };

  return (
    <>
      <EmailSentModal isOpen={isOpen} onClose={onClose} email={email} />
      <Container maxW="lg" py={{ base: '12', md: '24' }} px={{ base: '0', sm: '8' }}>
        <Stack spacing="8">
          <form
            autoComplete="off"
            onSubmit={handleSubmit(onSubmit)}
          >
            <Stack spacing="6" align="center">
              <Link as={ReactLink} to="/">
                <Image src={Logo} alt="Pay Collected Logo" fit="cover" htmlWidth="200px" loading="eager" />
              </Link>
              <Stack spacing="3" textAlign="center">
                <Heading size="lg">
                  Create an account
                </Heading>
                <HStack spacing="1" justify="center">
                  <Text color="muted">Already have an account?</Text>
                  <Button variant="link" colorScheme="blue" onClick={() => { navigate('/login'); }}>
                    Log in
                  </Button>
                </HStack>
              </Stack>
            </Stack>
            <Box
              py={{ base: '0', sm: '8' }}
              px={{ base: '4', sm: '10' }}
              bg={useBreakpointValue({ base: 'transparent', sm: 'bg-surface' })}
              boxShadow={{ base: 'none', sm: useColorModeValue('md', 'md-dark') }}
              borderRadius={{ base: 'none', sm: 'xl' }}
            >
              <Stack spacing="3">
                <FormControl
                  isRequired
                  isInvalid={errors.fullName || errorMessage === 'Please enter first and last name'}
                >
                  <FormLabel htmlFor="fullName">First and Last Name</FormLabel>
                  <Input
                    name="fullName"
                    type="text"
                    {...register('fullName', { required: 'First and last name required' })}
                  />
                  {errors.fullName && (
                    <FormErrorMessage>
                      {errors.fullName.message}
                    </FormErrorMessage>
                  )}
                </FormControl>
                <FormControl
                  isRequired
                  isInvalid={errors.username || errorMessage === 'Username already exists'}
                >
                  <FormLabel htmlFor="username">Username</FormLabel>
                  <Input
                    name="username"
                    type="text"
                    {...register('username', { required: 'Username required' })}
                  />
                  {errors.username && (
                    <FormErrorMessage>
                      {errors.username.message}
                    </FormErrorMessage>
                  )}
                </FormControl>
                <FormControl
                  isRequired
                  isInvalid={errors.email || errorMessage === 'Email already exists'}
                >
                  <FormLabel>Email</FormLabel>
                  <Input
                    name="email"
                    type="email"
                    {...register('email', { required: 'Email required' })}
                  />
                  {errors.email && (
                    <FormErrorMessage>
                      {errors.email.message}
                    </FormErrorMessage>
                  )}
                </FormControl>
                <FormControl
                  isRequired
                  isInvalid={errors.password || errorMessage === 'Passwords must match'}
                >
                  <FormLabel>Password</FormLabel>
                  <InputGroup>
                    <Input
                      name="password"
                      placeholdexr="Enter Password"
                      type={showPassword1 ? 'text' : 'password'}
                      {...register('password', { required: 'Password required' })}
                    />
                    <InputRightElement>
                      <IconButton
                        variant="link"
                        icon={showPassword1 ? <ViewOffIcon /> : <ViewIcon />}
                        onClick={() => setShowPassword1(!showPassword1)}
                      />
                    </InputRightElement>
                  </InputGroup>
                  {errors.password && (
                    <FormErrorMessage>
                      {errors.password.message}
                    </FormErrorMessage>
                  )}
                </FormControl>
                <FormControl
                  isRequired
                  isInvalid={errors.password2 || errorMessage === 'Passwords must match'}
                >
                  <FormLabel>Confirm Password</FormLabel>
                  <InputGroup>
                    <Input
                      name="password2"
                      type={showPassword2 ? 'text' : 'password'}
                      {...register('password2', { required: 'Please enter password again' })}
                    />
                    <InputRightElement>
                      <IconButton
                        variant="link"
                        icon={showPassword2 ? <ViewOffIcon /> : <ViewIcon />}
                        onClick={() => setShowPassword2(!showPassword2)}
                      />
                    </InputRightElement>
                  </InputGroup>
                  {errors.password2 && (
                    <FormErrorMessage>
                      {errors.password2.message}
                    </FormErrorMessage>
                  )}
                </FormControl>
                {errorMessage.length > 0 ? (
                  <Text color="red">{errorMessage}</Text>
                ) : (
                  <div>&nbsp;</div>
                )}
                <Button
                  type="submit"
                  isLoading={loading}
                  disabled={loading}
                >
                  Create account
                </Button>
              </Stack>
            </Box>
          </form>
        </Stack>
      </Container>
    </>
  );
}
