import React, { useState } from 'react';
import {
  Modal, ModalOverlay, ModalHeader, ModalBody, ModalCloseButton, ModalContent, Button, FormControl,
  FormLabel, Input, Text
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@apollo/client';
import { ResetPassword as RESET } from '../../graphql/mutations.gql';

export default function ForgotPwdModal({ isOpen, onClose }) {
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetError, setResetError] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [resetPwd, { loading }] = useMutation(RESET, {
    onCompleted: () => {
      setResetEmailSent(true);
      setResetError('');
    },
    onError: ({ message }) => {
      switch (message) {
        case 'This account does not exist':
          setResetError(message);
          break;
        case 'The email associated with this account has not been verified yet.':
          setResetError(message);
          break;
        default:
          setResetError('See console for error message');
          console.log('reset password error: ', message);
      }
    }
  });

  const onSubmit = ({ usernameOrEmail }) => {
    resetPwd({ variables: { usernameOrEmail } });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader fontSize="2xl" color="#2B6CB0">Reset Your Password</ModalHeader>
        <ModalCloseButton
          onClick={() => {
            setResetEmailSent(false);
            setResetError('');
            onClose();
          }}
        />
        <ModalBody>
          {!resetEmailSent
            && (
              <div>
                Enter your username or email and we will send you an email to reset your password.
                <br />
                <br />
              </div>
            )}
          {!resetEmailSent && resetError !== 'The email associated with this account has not been verified yet.' && (
            <form onSubmit={handleSubmit(onSubmit)}>
              <FormControl isRequired>
                <FormLabel>Username or Email</FormLabel>
                <Input
                  {...register('usernameOrEmail', { required: 'Missing username/email'})}
                  type="text"
                />
              </FormControl>
              <Button
                mt={5}
                type="submit"
                isLoading={loading}
                disabled={loading}
              >
                Submit
              </Button>
            </form>
          )}
          {resetEmailSent
            && (
            <div>
              {`We've sent instructions on how to reset your password to the email address on file.
              Please check your inbox, including your spam folder.
              `}
            </div>
            )}
          {resetError && (<Text color="red">{resetError}</Text>)}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
