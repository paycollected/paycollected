import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button, useClipboard, Flex, Heading, Box
} from '@chakra-ui/react';

export default function MagicLink({ planToJoin, setShowMagicLink }) {
  const navigate = useNavigate();
  const { hasCopied, onCopy } = useClipboard(`${process.env.CLIENT_HOST}:${process.env.SERVER_PORT}/join/${planToJoin}`);

  return (
    <Flex width="full" align="center" justifyContent="center">
      <Box p={2} my={8} width="40%" bg="white" borderRadius="15">
        <Box textAlign="center">
          <Heading>Magic Link</Heading>
        </Box>
        <Box textAlign="left">
          <p>Have other members on your plan join by sharing this link:</p>
          <Box>
            <Heading size="m">
              {`${process.env.CLIENT_HOST}:${process.env.SERVER_PORT}/join/${planToJoin}`}
            </Heading>
            <Button size="sm" onClick={onCopy}>
              {hasCopied ? 'Copied' : 'Copy'}
            </Button>
          </Box>
          <Button
            onClick={() => {
              setShowMagicLink(false);
              navigate(`/join/${planToJoin}`);
            }}
          >
            Join this plan!
          </Button>
          <Button
            onClick={() => {
              setShowMagicLink(false);
              navigate('/dashboard');
            }}
          >
            Dashboard
          </Button>
        </Box>
      </Box>
    </Flex>
  );
}
