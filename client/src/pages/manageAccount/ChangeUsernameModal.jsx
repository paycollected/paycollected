import React, { useState } from 'react';
import {
  Modal, ModalOverlay, ModalHeader, ModalBody, ModalCloseButton, ModalContent, Button, FormControl,
  FormLabel, Input, Text
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@apollo/client';
import { ChangeUsername as CHANGE_USERNAME } from '../../graphql/mutations.gql';

export default function ChangeUsernameModal({ isOpen, onClose, username }) {
  const [changeUsername, { loading: usernameLoading }] = useMutation(CHANGE_USERNAME, {
    onCompleted: ({ changeUsername: { username, token } }) => {
      setUser(username);
      localStorage.setItem('token', token);
      setStatus('success');
    },
    onError: ({ message }) => {
      setErrMsg(message);
      setStatus('error');
    },
  });
}
