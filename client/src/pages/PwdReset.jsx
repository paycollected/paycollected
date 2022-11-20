import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { useForm } from 'react-hook-form';
import {
  FormControl, FormLabel, Input, Button, FormErrorMessage,
} from '@chakra-ui/react';
import { ResetPasswordFromToken as RESET_FROM_TOKEN } from '../graphql/mutations.gql';

const queryStr = window.location.search;
let token;
if (queryStr.length > 0) {
  const urlParams = new URLSearchParams(queryStr);
  token = urlParams.get('token');
}

export default function PwdReset({ setUser }) {
  const navigate = useNavigate();
  const { register, handleSubmit, getValues, formState: { errors } } = useForm({ reValidateMode: 'onBlur' });
  const [reset, { loading }] = useMutation(RESET_FROM_TOKEN, {
    onCompleted: ({ resetPasswordFromToken: { username, token: logInToken } }) => {
      setUser(username);
      localStorage.setItem('token', logInToken);
      navigate('/dashboard');
    }
  });

  const onSubmit = ({ password1 }) => {
    reset({ variables: { token, newPassword: password1 } });
  };

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormControl isRequired isInvalid={errors.password1}>
          <FormLabel>New Password</FormLabel>
          <Input
            {...register('password1', { required: 'Missing password input'})}
            type="password"
          />
          {errors.password1 && (
            <FormErrorMessage>{errors.password1.message}</FormErrorMessage>
          )}
        </FormControl>
        <FormControl isRequired isInvalid={errors.password2}>
          <FormLabel>Verify New Password</FormLabel>
          <Input
            {...register('password2', {
              required: 'Missing verification of password input',
              validate: (val) => val === getValues('password1') || "Password inputs don't match"
            })}
            type="password"
          />
          {console.log(errors.password2)}
          {errors.password2 && (
            <FormErrorMessage>{errors.password2.message}</FormErrorMessage>
          )}
        </FormControl>
        <Button type="submit">Submit</Button>
      </form>
    </div>
  );
}