import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { useForm } from 'react-hook-form';
import {
  FormControl, FormLabel, Input, Button, FormErrorMessage, Flex, Box,
} from '@chakra-ui/react';
import {
  ChangePassword as CHANGE_PASSWORD,
  ChangeUsername as CHANGE_USERNAME,
  ChangeEmail as CHANGE_EMAIL,
} from '../graphql/mutations.gql';

export default function ManageAccount({ user, setUser }) {
  const [action, setAction] = useState('password');
  const [status, setStatus] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const navigate = useNavigate();
  const {
    register, handleSubmit, formState: { errors }, getValues
  } = useForm({ reValidateMode: 'onBlur' });
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
        changeEmail({ variables: { newEmail, password } });
        break;
      default:
        ({ newPassword, currentPassword } = data);
        changePassword({ variables: { newPassword, currentPassword }});
        break;
    }
  };

  return (
    <>
      <h3>This is the manage account page</h3>
      {status === 'error' && (<div>{errMsg}</div>)}
      {status === 'success' && action === 'email' && (
        <div>{
          `Your request has been successfully submitted.
          Please follow the instructions sent to this new address to complete the verification process.`
        }</div>
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
        <Button type="button" onClick={() => { navigate('/dashboard'); }}>Back to dashboard</Button>
      </Box>
    </>
  );
}
