import React, { useState } from 'react';
import {
  Modal, ModalOverlay, ModalHeader, ModalBody, ModalContent, ModalCloseButton,
  Button, FormControl, FormLabel, Input, Text
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@apollo/client';
import { ResendVerificationEmail as REVERIFY } from '../../graphql/mutations.gql';

export default function ReverifyEmailModal({ isOpen, onClose }) {
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
  const [email, setEmail] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [reverify, { loading }] = useMutation(REVERIFY, {
    onCompleted: () => {
      setVerificationEmailSent(true);
      setVerificationError('');
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
          setVerificationError('See console for error message');
          console.log('verification error: ', message);
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
      <ModalContent pb="6">
        <ModalHeader fontSize="2xl" color="#2B6CB0">Verify Your Email</ModalHeader>
        <ModalCloseButton
          onClick={() => {
            setVerificationEmailSent(false);
            setVerificationError('');
            setEmail('');
            onClose();
          }}
        />
        <ModalBody>
          {!verificationEmailSent
            && (
              <div>
                Enter your email and we will send you an email with a verification link.
                <br />
                <br />
              </div>
            )}
          {!verificationEmailSent && verificationError !== 'This email has already been verified.' && (
            <form onSubmit={handleSubmit(onSubmit)}>
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  {...register('reverifyEmail', { required: 'Missing email'})}
                  type="email"
                />
              </FormControl>
              <Button mt={5} type="submit">Submit</Button>
            </form>
          )}
          {verificationEmailSent && (
            <div>{`We've sent a verification email to ${email}. Please check your inbox for instructions.`}</div>
          )}
          {verificationError && (<Text color="red">{verificationError}</Text>)}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
