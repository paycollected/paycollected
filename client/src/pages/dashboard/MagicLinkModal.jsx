import React from 'react';
import {
  Button, useClipboard, Flex, Heading, Box, Modal, ModalOverlay, ModalContent, ModalCloseButton,
  ModalHeader, ModalBody, ModalFooter, Text, HStack, VStack, FormControl, FormLabel, FormErrorMessage,
  InputGroup, Input, InputRightAddon,
} from '@chakra-ui/react';

export default function MagicLink({ isOpen, onClose, planId, planName }) {
  // const { hasCopied, onCopy } = useClipboard(`${process.env.HOST}/join/${planToJoin}`);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader><Heading as="h2">{`Invite Your Friends To Join ${planName}`}</Heading></ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack w="100%" spacing={8}>
            <Flex w="100%" justify="left" direction="column">
              <Text as="h5" textStyle="formLabel" fontSize="md" mb={4}>Share Magic Link</Text>
              <InputGroup>
                <Input type="url" readOnly value={`${process.env.HOST}/join/${planId}`} />
                <InputRightAddon children="copy" />
              </InputGroup>
            </Flex>
            <Flex w="100%" justify="left" direction="column">
              <Text as="h5" textStyle="formLabel" fontSize="md" mb={4}>Share Plan Code</Text>
              <InputGroup>
                <Input type="url" readOnly value={planId} />
                <InputRightAddon children="copy" />
              </InputGroup>
            </Flex>
          </VStack>
        </ModalBody>
        <ModalFooter><Button onClick={onClose}>Close</Button></ModalFooter>
      </ModalContent>
    </Modal>
  );
}
