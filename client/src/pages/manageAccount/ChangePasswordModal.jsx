import React, { useState } from 'react';
import {
  Modal, ModalOverlay, ModalHeader, ModalBody, ModalCloseButton, ModalContent, Button, FormControl,
  FormLabel, Input, Text, FormErrorMessage
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@apollo/client';
import { ChangePassword as CHANGE_PASSWORD } from '../../graphql/mutations.gql';

export default function ChangePasswordModal({ isOpen, onClose }) {
  const [changePassword, { loading: passwordLoading }] = useMutation(CHANGE_PASSWORD, {
    onCompleted: () => setStatus('success'),
    onError: ({ message }) => {
      setErrMsg(message);
      setStatus('error');
    }
  });
}
