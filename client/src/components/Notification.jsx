import React from 'react';
import {
  PopoverBody, Divider, Container, Text, Button, VStack
} from '@chakra-ui/react';

export default function Notification({ notification, deleteNotification }) {
  const { id, content, subject } = notification;

  return (
    <>
      <PopoverBody>
        <Container w="95%">
          <VStack spacing={4}>
            <Text>{subject}</Text>
            <Text>{content}</Text>
          </VStack>
          <Button
            type="button"
            variant="navActionBtn"
            onClick={() => { deleteNotification({ variables: { notificationId: id } }); }}
          >
            Dismiss
          </Button>
        </Container>
      </PopoverBody>
      <PopoverBody><Divider /></PopoverBody>
    </>
  );
}
