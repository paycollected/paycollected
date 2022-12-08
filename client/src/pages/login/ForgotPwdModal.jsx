import React, { useState } from 'react';
import {
  Modal, ModalOverlay, ModalHeader, ModalBody, ModalFooter, ModalContent, Button, FormControl,
  FormLabel, Input
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@apollo/client';
import { ResetPassword as RESET } from '../../graphql/mutations.gql';

export default function ForgotPwdModal({ isOpen, onClose }) {
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [resetPwd, { loading }] = useMutation(RESET, {
    onCompleted: () => { setResetEmailSent(true); }
  });

  const onSubmit = ({ usernameOrEmail }) => {
    resetPwd({ variables: { usernameOrEmail }});
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Reset Your Password</ModalHeader>
        <ModalBody>
          {!resetEmailSent && (
            <form onSubmit={handleSubmit(onSubmit)}>
              <FormControl isRequired>
                <FormLabel>Username or Email</FormLabel>
                <Input
                  {...register('usernameOrEmail', { required: 'Missing username/email'})}
                  type="text"
                />
              </FormControl>
              <Button type="submit">Submit</Button>
            </form>
          )}
          {resetEmailSent && (
            <div>
              {`We've sent instructions on how to reset your password to the email address on file.
              Please check your inbox including your spam folder.
              `}
            </div>)}
        </ModalBody>
        <ModalFooter>
          <Button
            onClick={() => {
              setResetEmailSent(false);
              onClose();
            }}
          >
            Back
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
