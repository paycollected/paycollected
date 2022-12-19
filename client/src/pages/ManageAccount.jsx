import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useForm } from 'react-hook-form';
import {
  FormControl, FormLabel, Input, Button, FormErrorMessage, Flex, Box, IconButton,
  VStack, Heading, TableContainer, Table, Tbody, Tr, Td, useBreakpointValue
} from '@chakra-ui/react';
import { EditIcon } from '@chakra-ui/icons';
import {
  ChangePassword as CHANGE_PASSWORD,
  ChangeUsername as CHANGE_USERNAME,
  ChangeEmail as CHANGE_EMAIL,
  ResendVerificationEmail as REVERIFY,
} from '../graphql/mutations.gql';
import { GetEmail as GET_EMAIL } from '../graphql/queries.gql';
import NavBar from '../components/NavBar.jsx';

export default function ManageAccount({
  user, setUser, setPlanToJoin, setPlanToView
}) {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const [action, setAction] = useState('password');
  const [status, setStatus] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const [email, setEmail] = useState('');
  const {
    register, handleSubmit, formState: { errors }, getValues
  } = useForm({ reValidateMode: 'onBlur' });

  const {
    loading: getEmailLoading, data: getEmailData, error: getEmailError
  } = useQuery(GET_EMAIL, {
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-only',
  });
  const [changeUsername, { loading: usernameLoading }] = useMutation(CHANGE_USERNAME, {
    onCompleted: ({ changeUsername: { username, token } }) => {
      setUser(username);
      localStorage.setItem('token', token);
      setStatus('success');
    },
    onError: ({ message }) => {
      setErrMsg(message);
      setStatus('error');
    },
  });
  const [changeEmail, { loading: emailLoading }] = useMutation(CHANGE_EMAIL, {
    onCompleted: () => setStatus('success'),
    onError: ({ message }) => {
      setErrMsg(message);
      setStatus('error');
    }
  });
  const [changePassword, { loading: passwordLoading }] = useMutation(CHANGE_PASSWORD, {
    onCompleted: () => setStatus('success'),
    onError: ({ message }) => {
      setErrMsg(message);
      setStatus('error');
    }
  });
  const [resendVerificationEmail, { loading: reverifyLoading }] = useMutation(REVERIFY, {
    onCompleted: () => setStatus('resent'),
    onError: ({ message }) => {
      setErrMsg(message);
      setStatus('error');
    }
  });

  const onSubmit = (data) => {
    let newUsername;
    let password;
    let newEmail;
    let newPassword;
    let currentPassword;
    switch (action) {
      case 'username':
        ({ newUsername, currentPassword: password } = data);
        changeUsername({ variables: { newUsername, password } });
        break;
      case 'email':
        ({ newEmail, currentPassword: password } = data);
        setEmail(newEmail);
        changeEmail({ variables: { newEmail, password } });
        break;
      default:
        ({ newPassword, currentPassword } = data);
        changePassword({ variables: { newPassword, currentPassword }});
        break;
    }
  };

  const reverify = () => { resendVerificationEmail({ variables: { email } }); };

  return (
    <>
      <NavBar
        user={user}
        setUser={setUser}
        setPlanToJoin={setPlanToJoin}
        setPlanToView={setPlanToView}
      />
      <VStack w="93%" align="left" spacing={{ base: '6', md: '10' }} mb="10">
        <Heading as="h1" fontSize="3xl">Profile</Heading>
        <TableContainer width="75%">
          <Table variant="unstyled" size={isMobile ? 'sm' : 'md'}>
            <Tbody>
              <Tr>
                <Td fontWeight="bold">Username</Td>
                <Td>{getEmailData?.getEmail.username}</Td>
                <Td>
                  {isMobile
                    ? <IconButton variant="outline" size="sm" icon={<EditIcon />} />
                    : (
                      <Button rightIcon={<EditIcon />} size="sm" variant="outline">
                        Edit
                      </Button>
                    )}
                </Td>
              </Tr>
              <Tr>
                <Td fontWeight="bold">Email</Td>
                <Td>{getEmailData?.getEmail.email}</Td>
              </Tr>
            </Tbody>
          </Table>
        </TableContainer>
      </VStack>
      {status === 'error' && (<div>{errMsg}</div>)}
      {status === 'success' && action === 'email' && (
        <div>
          <div>
            Your request has been successfully submitted.
            Please follow the instructions sent to this new address to complete the verification process.
          </div>
          <div>
            Still haven&apos;t received the email?
            <Button type="button" onClick={reverify}>Resend it!</Button>
          </div>
        </div>
      )}
      {status === 'resent' && (
        <div>
          <div>
          {`Another verification has been sent to ${email}. Please check your mailbox, including the spam folder.`}
          </div>
          <div>If you&apos;re still having trouble, please contact us at admin@paycollected.com for support.</div>
        </div>
      )}
      {status === 'success' && action === 'password' && (
        <div>{
          `Your password has been changed successfully.
          You will need to use this new password the next time logging in.`
        }</div>
      )}
      {status === 'success' && action === 'username' && (
        <div>Your username has been changed successfully.</div>
      )}
      <Flex width="full" align="center" justifyContent="left">
        <Button onClick={() => { setAction('password'); }}>Change password</Button>
        <Button onClick={() => { setAction('username'); }}>Change username</Button>
        <Button onClick={() => { setAction('email'); }}>Change email</Button>
      </Flex>
      <Box w="50%">
        <form onSubmit={handleSubmit(onSubmit)}>
          {action === 'password' && (
            <>
              <FormControl isRequired isInvalid={errors.newPassword}>
                <FormLabel>New Password</FormLabel>
                <Input
                  {...register('newPassword', {
                    required: 'Missing new password input',
                    validate: (val) => val !== getValues('currentPassword') || 'New password must be different from current password',
                  })}
                  type="password"
                />
                {errors.newPassword && (
                  <FormErrorMessage>{errors.newPassword.message}</FormErrorMessage>
                )}
              </FormControl>
              <FormControl isRequired isInvalid={errors.newPassword2}>
                <FormLabel>Confirm New Password</FormLabel>
                <Input
                  {...register('newPassword2', {
                    required: 'Missing new password confirmation',
                    validate: (val) => val === getValues('newPassword') || "New password inputs don't match",
                  })}
                  type="password"
                />
                {errors.newPassword2 && (
                  <FormErrorMessage>{errors.newPassword2.message}</FormErrorMessage>
                )}
              </FormControl>
            </>
          )}
          {action === 'username' && (
            <FormControl isRequired isInvalid={errors.newUsername}>
              <FormLabel>New Username</FormLabel>
              <Input
                {...register('newUsername', {
                  required: 'Missing new username',
                  validate: (val) => val !== user || 'New username must be different from current username',
                })}
                type="text"
              />
              {errors.newUsername && (
                <FormErrorMessage>{errors.newUsername.message}</FormErrorMessage>
              )}
            </FormControl>
          )}
          {action === 'email' && (
            <FormControl isRequired isInvalid={errors.newEmail}>
              <FormLabel>New Email</FormLabel>
              <Input {...register('newEmail', { required: 'Missing new email'})} type="email" />
              {errors.newEmail && (
                <FormErrorMessage>{errors.newEmail.message}</FormErrorMessage>
              )}
            </FormControl>
          )}
          <FormControl isRequired isInvalid={errors.currentPassword}>
            <FormLabel>Current Password</FormLabel>
            <Input
              {...register('currentPassword', { required: 'Missing current password input' })}
              type="password"
            />
            {errors.currentPassword && (
              <FormErrorMessage>{errors.currentPassword.message}</FormErrorMessage>
            )}
          </FormControl>
          <Button type="submit">Submit</Button>
        </form>
      </Box>
    </>
  );
}
