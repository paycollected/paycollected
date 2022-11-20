import React, { useState } from 'react';
import {
  Modal, ModalOverlay, ModalHeader, ModalBody, ModalFooter, ModalContent, Button, FormControl,
  FormLabel, Input
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@apollo/client';
import { ResetPassword as RESET } from '../graphql/mutations.gql';

export default function ForgotPwd({ isOpen, onClose }) {
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
              <FormControl>
                <FormLabel>Username or Email</FormLabel>
                <Input
                  {...register('usernameOrEmail', { required: 'Missing username/email'})}
                  type="text"
                />
              </FormControl>
              <Button type="submit">Submit</Button>
            </form>
          )}

        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Back</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
