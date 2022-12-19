import React, { useState, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalHeader, ModalBody, ModalCloseButton, ModalContent, Button, FormControl,
  FormLabel, FormErrorMessage, Input, Text, VStack
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@apollo/client';
import {
  ChangeEmail as CHANGE_EMAIL,
  ResendVerificationEmail as REVERIFY
} from '../../graphql/mutations.gql';

export default function ChangeEmailModal({
  isOpen, onClose, email, setEmail
}) {
  const {
    register, handleSubmit, formState: { errors }, reset
  } = useForm({
    defaultValues: {
      newEmail: email
    }
  });

  const [emailChanged, setEmailChanged] = useState(false);
  const [emailToSend, setEmailToSend] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const [resent, setResent] = useState(false);

  const [changeEmail, { loading: emailLoading }] = useMutation(CHANGE_EMAIL, {
    onCompleted: () => {
      setEmailChanged(true);
      setErrMsg('');
      setEmail(emailToSend);
    },
    onError: ({ message }) => {
      setErrMsg(message);
      setEmailChanged(false);
    }
  });
  const [resendVerificationEmail, { loading: reverifyLoading }] = useMutation(REVERIFY, {
    onCompleted: () => {
      setResent(true);
      setErrMsg('');
    },
    onError: ({ message }) => {
      setResent(false);
      setErrMsg(message);
    }
  });

  useEffect(() => {
    reset({ newEmail: email });
  }, [email]);

  const onSubmit = ({ newEmail, currentPassword }) => {
    setEmailToSend(newEmail);
    changeEmail({ variables: { newEmail, password: currentPassword } });
  };

  const reverify = () => { resendVerificationEmail({ variables: { email: emailToSend } }); };
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setEmailChanged(false);
        setErrMsg('');
        setResent(false);
        onClose();
      }}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader fontSize="2xl" color="#2B6CB0">Change Email</ModalHeader>
        <ModalCloseButton />
        <ModalBody mb={3}>
          {!emailChanged
            && (
              <form onSubmit={handleSubmit(onSubmit)}>
                <VStack spacing="5">
                  <FormControl isRequired isInvalid={errors.newEmail}>
                    <FormLabel>New Email</FormLabel>
                    <Input autoFocus {...register('newEmail', { required: 'Missing new email'})} type="email" />
                    {errors.newEmail && (
                      <FormErrorMessage>{errors.newEmail.message}</FormErrorMessage>
                    )}
                  </FormControl>
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
                  {errMsg && (<Text color="red" justify="left">{errMsg}</Text>)}
                  <Button type="submit" isLoading={emailLoading} disabled={emailLoading}>Submit</Button>
                </VStack>
              </form>
            )}
          {emailChanged && !resent
            && (
              <>
                Your request has been successfully submitted.
                <br />
                Please follow the instructions sent to this new address to
                complete the verification process.
                <br />
                <br />
                Still haven&apos;t received the email?&nbsp;
                <Button variant="link" colorScheme="blue" disabled={reverifyLoading} onClick={reverify}>Resend it!</Button>
                {errMsg && (<Text color="red" justify="left">{errMsg}</Text>)}
              </>
            )}
          {emailChanged && resent
            && (
              <>
                {`Another verification has been sent to ${emailToSend}. Please check your mailbox, including the spam folder.`}
                <br />
                <br />
                If you&apos;re still having trouble,
                please contact us at admin@paycollected.com for support.
              </>
            )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
