import React, { useState } from 'react';
import {
  Modal, ModalOverlay, ModalHeader, ModalBody, ModalFooter, ModalContent, Button, FormControl,
  FormLabel, Input
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@apollo/client';
import { ResendVerificationEmail as REVERIFY } from '../graphql/mutations.gql';

export default function ReverifyEmail({ isOpen, onClose }) {
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
  const [email, setEmail] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [reverify, { loading }] = useMutation(REVERIFY, {
    onCompleted: () => {
      setVerificationEmailSent(true);
    },
    onError: ({ message }) => {
      switch (message) {
        case 'No account associated with this email was found.':
          setVerificationError(message);
          break;
        case 'This email has already been verified.':
          setVerificationError(message);
          break;
        default:
          console.log(message);
      }
    },
  });

  const onSubmit = ({ reverifyEmail }) => {
    setEmail(reverifyEmail);
    reverify({ variables: { email: reverifyEmail } });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Resend Your Verification Email</ModalHeader>
        <ModalBody>
          {!verificationEmailSent && !verificationError && (
            <form onSubmit={handleSubmit(onSubmit)}>
              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input
                  {...register('reverifyEmail', { required: 'Missing email'})}
                  type="email"
                />
              </FormControl>
              <Button type="submit">Submit</Button>
            </form>
          )}
          {verificationEmailSent && (
            <div>{`We've sent a verification email to ${email}. Please check your inbox for instructions.`}</div>
          )}
          {verificationError && (<div>{verificationError}</div>)}
        </ModalBody>
        <ModalFooter>
          <Button
            onClick={() => {
              setVerificationEmailSent(false);
              setVerificationError('');
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
