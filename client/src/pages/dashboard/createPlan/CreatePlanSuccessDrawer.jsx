import React from 'react';
import { useMutation } from '@apollo/client';
import {
  Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton, DrawerHeader, DrawerBody, DrawerFooter,
  Stack, Box, Button, HStack, useBreakpointValue
} from '@chakra-ui/react';

export default function CreatePlanSuccessDrawer({
  isOpen, onClose, planToJoin
}) {
  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    <Drawer isOpen={isOpen} onClose={onClose} placement="right" size={isMobile ? 'full' : 'md'}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader color="#2B6CB0">Success! Your plan was created</DrawerHeader>
        <DrawerBody>
          <Stack spacing="3">
            <Box>
              Join the plan or invite your friends.
            </Box>
          </Stack>
        </DrawerBody>
        <DrawerFooter borderTopWidth="1px">
          <HStack width="100%" justify="space-between">
            <Button variant="outline" width="45%" onClick={onClose}>Close</Button>
            <Button variant="solid" width="45%">Join Plan</Button>
          </HStack>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
