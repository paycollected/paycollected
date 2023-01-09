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
  const { register, handleSubmit, getValues, formState: { errors } } = useForm();
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
    fullName, username, password, email: inputEmail,
  }) => {
    setErrorMessage('');
    setEmail(inputEmail);
    const [firstName, lastName] = fullName.split(' ');
    signup({
      variables: {
        firstName, lastName, username, password, email: inputEmail,
      },
    });
  };

  return (
    <>
      <EmailSentModal isOpen={isOpen} onClose={onClose} email={email} />
      <Container w="xl" py={{ base: '12', md: '12' }} px={{ base: '0', sm: '8' }}>
        <Stack spacing="8">
          <form
            autoComplete="off"
            onSubmit={handleSubmit(onSubmit)}
          >
            <Stack spacing="6" align="center" pb={8}>
              <Link as={ReactLink} to="/">
                <Image src={Logo} alt="Pay Collected Logo" fit="cover" htmlWidth="200px" loading="eager" />
              </Link>
              <Stack spacing="3" textAlign="center">
                <Heading size="lg" color="black">
                  Create an account
                </Heading>
                <HStack spacing="2" justify="center">
                  <Text color="muted">Already have an account?</Text>
                  <Button variant="link" colorScheme="blue" fontWeight="normal" onClick={() => { navigate('/login'); }}>
                    Log in
                  </Button>
                </HStack>
              </Stack>
            </Stack>
            <Box
              py={{ base: '0', sm: '12' }}
              px={{ base: '4', sm: '14' }}
              bg={useBreakpointValue({ base: 'transparent', sm: 'bg-surface' })}
              border="1px solid #DFDFDF"
              borderRadius={{ base: 'none', sm: 'xl' }}
            >
              <Stack spacing="5">
                <FormControl
                  isRequired
                  isInvalid={errors.fullName}
                >
                  <FormLabel htmlFor="fullName" textStyle="formLabel" fontWeight={600}>First and Last Name</FormLabel>
                  <Input
                    name="fullName"
                    type="text"
                    autoFocus
                    {...register('fullName', {
                      required: 'First and last name required',
                      setValueAs: (fullName) => fullName.trim(),
                      validate: {
                        firstNameExists: (fullName) => !!(fullName.split(' ')[0]) || 'Missing first name',
                        lastNameExists: (fullName) => !!(fullName.split(' ')[1]) || 'Missing last name',
                        onlyFirstAndLast: (fullName) => fullName.split(' ').length === 2 || 'First and last names must be separated by exactly one space character',
                        firstNameLength: (fullName) => fullName.split(' ')[0].length <= 100 || 'First name must be no more than 100 characters',
                        lastNameLength: (fullName) => fullName.split(' ')[1].length <= 100 || 'Last name must be no more than 100 characters',
                      }
                    })}
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
                  <FormLabel htmlFor="username" textStyle="formLabel" fontWeight={600}>Username</FormLabel>
                  <Input
                    name="username"
                    type="text"
                    {...register('username', {
                      required: 'Username required',
                      setValueAs: (username) => username.trim(),
                      maxLength: { value: 50, message: 'Username must be 50 characters or less'},
                      minLength: { value: 5, message: 'Username must be at least 5 characters'},
                    })}
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
                  <FormLabel textStyle="formLabel" fontWeight={600}>Email</FormLabel>
                  <Input
                    name="email"
                    type="email"
                    {...register('email', {
                      required: 'Email required',
                      setValueAs: (email) => email.trim(),
                      maxLength: { value: 100, message: 'Email cannot be longer than 100 characters'},
                      pattern: {
                        value: /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
                        message: 'Invalid email'
                      }
                    })}
                  />
                  {errors.email && (
                    <FormErrorMessage>
                      {errors.email.message}
                    </FormErrorMessage>
                  )}
                </FormControl>
                <FormControl
                  isRequired
                  isInvalid={errors.password}
                >
                  <FormLabel textStyle="formLabel" fontWeight={600}>Password</FormLabel>
                  <InputGroup>
                    <Input
                      name="password"
                      type={showPassword1 ? 'text' : 'password'}
                      {...register('password', {
                        required: 'Password required',
                        minLength: { value: 7, message: 'Password must be at least 7 characters'},
                        setValueAs: (pwd) => pwd.trim(),
                      })}
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
                  isInvalid={errors.password2}
                >
                  <FormLabel textStyle="formLabel" fontWeight={600}>Confirm Password</FormLabel>
                  <InputGroup>
                    <Input
                      name="password2"
                      type={showPassword2 ? 'text' : 'password'}
                      {...register('password2', {
                        required: 'Please enter password again',
                        setValueAs: (pwd) => pwd.trim(),
                        minLength: { value: 7, message: 'Password must be at least 7 characters'},
                        validate: (pwd) => pwd === getValues('password') || 'Passwords must match',
                      })}
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
                  <>&nbsp;</>
                )}
                <Button
                  type="submit"
                  isLoading={loading}
                  disabled={loading}
                  bg="#272088"
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
