import React from 'react';
import {
  PopoverBody, Divider, Container, Text, Button, VStack, Flex, Box,
} from '@chakra-ui/react';

export default function Notification({ notification, deleteNotification }) {
  const {
    id, content, subject, createdAt,
  } = notification;

  return (
    <Container px={2} pt={1}>
      <PopoverBody>
        <Container w="100%" px={3}>
          <VStack w="100%" spacing={3}>
            <Flex w="100%" justify="space-between">
              <Box w="70%" p={0}>
                <Text fontWeight="600" fontSize="sm" color="gray.700">{subject}</Text>
              </Box>
              <Button
                type="button"
                variant="dismiss"
                onClick={() => { deleteNotification({ variables: { notificationId: id } }); }}
              >
                Dismiss
              </Button>
            </Flex>
            <Text fontWeight="400" fontSize="sm" color="gray.700">{content}</Text>
          </VStack>
        </Container>
      </PopoverBody>
      <PopoverBody><Divider /></PopoverBody>
    </Container>
  );
}
