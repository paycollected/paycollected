import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Modal, ModalOverlay, ModalHeader, ModalBody, ModalCloseButton, ModalContent, ModalFooter,
  Button, Text, Alert, AlertIcon
} from '@chakra-ui/react';
import { useMutation } from '@apollo/client';
import { ResendVerificationEmail as REVERIFY } from '../../graphql/mutations.gql';

export default function EmailSentModal({ isOpen, onClose, email }) {
  const navigate = useNavigate();
  const [verificationError, setVerificationError] = useState('');
  const [emailSent, setEmailSent] = useState(true);
  const [emailResent, setEmailResent] = useState(false);

  const [reverify, { loading }] = useMutation(REVERIFY, {
    onCompleted: () => {
      setEmailResent(true);
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
          setVerificationError('See console for reverification error');
          console.log('reverification error: ', message);
      }
    },
  });

  const onSubmitReverify = () => {
    setEmailSent(false);
    setVerificationError('');
    reverify({ variables: { email } });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Account Created!</ModalHeader>
        <ModalCloseButton
          onClick={() => onClose()}
        />
        <ModalBody>
          {emailSent && (
            <div>
              <Alert status="success">
                <AlertIcon />
                An email has been sent to the provided address!
              </Alert>
              <br />
              Please check your inbox and follow the instructions to complete the sign up process.
              <br />
              <br />
              Note that depending on your email settings, it may end up in the spam folder.
              <br />
              <br />
              <Text color="muted">
                {'Still haven\'t received the verification email? '}
                <Button
                  variant="link"
                  colorScheme="blue"
                  onClick={onSubmitReverify}
                  disabled={loading}
                >
                  Resend it!
                </Button>
              </Text>
            </div>
          )}
          {emailResent && (
            <div>
              {`A verification email has been sent to ${email}.`}
              <br />
              Please check your inbox again, including the spam folder.
              <br />
              <br />
              If you are still having issues, please contact us at admin@paycollect.com.
            </div>
          )}
          {verificationError && (<Text color="red">{verificationError}</Text>)}
        </ModalBody>
        <ModalFooter>
          <Button onClick={() => navigate('/login')}>
            Login
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

