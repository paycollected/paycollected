import React, { useEffect } from 'react';
import {
  Button, useClipboard, Flex, Heading, Modal, ModalOverlay, ModalContent, ModalCloseButton,
  ModalHeader, ModalBody, ModalFooter, Text, VStack, InputGroup, Input, InputRightAddon,
} from '@chakra-ui/react';

export default function MagicLink({
  isOpen, onClose, planId, planName,
}) {
  const { onCopy: onCopyURL, setValue: setValueURL } = useClipboard('');
  const { onCopy: onCopyCode, setValue: setValueCode } = useClipboard('');
  useEffect(() => {
    setValueURL(`${process.env.HOST}/join/${planId}`);
    setValueCode(planId);
  }, [planId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader><Heading as="h2">{`Invite Your Friends To Join ${planName}`}</Heading></ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack w="100%" spacing={8}>
            <Flex w="100%" justify="left">
              <Flex w="75%" direction="column">
                <Text as="h5" textStyle="formLabel" fontSize="md" mb={4}>Share Magic Link</Text>
                <InputGroup>
                  <Input type="url" readOnly value={`${process.env.HOST}/join/${planId}`} fontSize="14px" color="blackAlpha.800" />
                  <InputRightAddon
                    p={0}
                    children={<Button type="button" onClick={onCopyURL} variant="copyBtn">copy</Button>}
                  />
                </InputGroup>
              </Flex>
            </Flex>
            <Flex w="100%" justify="left">
              <Flex w="75%" direction="column">
                <Text as="h5" textStyle="formLabel" fontSize="md" mb={4}>Share Plan Code</Text>
                <InputGroup>
                  <Input type="text" readOnly value={planId} fontSize="14px" color="blackAlpha.800" />
                  <InputRightAddon
                    p={0}
                    children={<Button type="button" onClick={onCopyCode} variant="copyBtn">copy</Button>}
                  />
                </InputGroup>
              </Flex>
            </Flex>
          </VStack>
        </ModalBody>
        <ModalFooter><Button onClick={onClose}>Close</Button></ModalFooter>
      </ModalContent>
    </Modal>
  );
}
