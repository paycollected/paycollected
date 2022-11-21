import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { useForm } from 'react-hook-form';
import {
  FormControl, FormLabel, Input, Button, FormErrorMessage, Flex, Box,
} from '@chakra-ui/react';

export default function ManageAccount({ user }) {
  const [action, setAction] = useState('password');
  const navigate = useNavigate();
  const {
    register, handleSubmit, formState: { errors }, getValues
  } = useForm({ reValidateMode: 'onBlur' });

  const onSubmit = (data) => {
    console.log(data);
  };

  return (
    <>
      <h3>This is the manage account page</h3>
      <Flex width="full" align="center" justifyContent="left">
        <Button>Change password</Button>
        <Button>Change username</Button>
        <Button>Change email</Button>
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
