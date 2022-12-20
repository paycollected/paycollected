import React, { useState, useEffect } from 'react';
import { useNavigate, Link as ReactLink } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { useForm } from 'react-hook-form';
import {
  Button, Input, InputGroup, InputRightElement, Link, Image,
  FormControl, FormLabel, FormErrorMessage, IconButton,
  Container, Box, Stack, Text, Heading, useToast, useBreakpointValue, useColorModeValue
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import Logo from '../public/Pay_Collected_Logo.png';
import { ResetPasswordFromToken as RESET_FROM_TOKEN } from '../graphql/mutations.gql';

const queryStr = window.location.search;
let token;
if (queryStr.length > 0) {
  const urlParams = new URLSearchParams(queryStr);
  token = urlParams.get('token');
}

export default function PwdReset({ setUser }) {
  const navigate = useNavigate();
  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const toast = useToast();
  const {
    register, handleSubmit, getValues, formState: { errors }
  } = useForm({ reValidateMode: 'onBlur' });
  const [reset, { loading }] = useMutation(RESET_FROM_TOKEN, {
    onCompleted: ({ resetPasswordFromToken: { username, token: logInToken } }) => {
      setErrorMsg('');
      toast({
        title: 'Password Reset!',
        description: 'Logging you in and redirecting to your dashboard...',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
      setUser(username);
      localStorage.setItem('token', logInToken);
      navigate('/dashboard');
    },
    onError: ({ message }) => {
      setErrorMsg(message);
    }
  });

  const onSubmit = ({ password1 }) => {
    reset({ variables: { token, newPassword: password1 } });
  };

  useEffect(() => { if (!token) { navigate('/404'); } }, []);

  return (
    <Container maxW="lg" py={{ base: '12', md: '24' }} px={{ base: '0', sm: '8' }}>
      <Stack spacing="8">
        <form
          autoComplete="off"
          onSubmit={handleSubmit(onSubmit)}
        >
          <Stack pb="6" align="center">
            <Link as={ReactLink} to="/">
              <Image src={Logo} alt="Pay Collected Logo" fit="cover" htmlWidth="200px" loading="eager" />
            </Link>
          </Stack>
          <Stack spacing="3" textAlign="center">
            <Heading size="lg">
              Reset your password
            </Heading>
          </Stack>
          <Box
            py={{ base: '0', sm: '8' }}
            px={{ base: '4', sm: '10' }}
            bg={useBreakpointValue({ base: 'transparent', sm: 'bg-surface' })}
            boxShadow={{ base: 'none', sm: useColorModeValue('md', 'md-dark') }}
            borderRadius={{ base: 'none', sm: 'xl' }}
          >
            <Stack spacing="3">
              <FormControl isRequired isInvalid={errors.password1}>
                <FormLabel htmlFor="newPassword">New Password</FormLabel>
                <InputGroup>
                  <Input
                    autoFocus
                    type={showPassword1 ? 'text' : 'password'}
                    {...register('password1', { required: 'Enter new password'})}
                  />
                  <InputRightElement>
                    <IconButton
                      variant="link"
                      icon={showPassword1 ? <ViewOffIcon /> : <ViewIcon />}
                      onClick={() => setShowPassword1(!showPassword1)}
                    />
                  </InputRightElement>
                </InputGroup>
                {errors.password1 ? (
                  <FormErrorMessage>{errors.password1.message}</FormErrorMessage>
                ) : (
                  <div>&nbsp;</div>
                )}
              </FormControl>
              <FormControl isRequired isInvalid={errors.password2}>
                <FormLabel htmlFor="confirmPassword">Confirm New Password</FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword2 ? 'text' : 'password'}
                    {...register('password2', {
                      required: 'Enter password again',
                      validate: (val) => val === getValues('password1') || "Passwords do not match"
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
                {errors.password2 ? (
                  <FormErrorMessage>{errors.password2.message}</FormErrorMessage>
                ) : (
                  <div>&nbsp;</div>
                )}
              </FormControl>
              {errorMsg && (<Text color="red">{errorMsg}</Text>)}
              <Button type="submit" isLoading={loading} disabled={loading}>Submit</Button>
            </Stack>
          </Box>
        </form>
      </Stack>
    </Container>
  );
}
