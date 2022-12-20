import React from 'react';
import { useNavigate, Link as ReactLink } from 'react-router-dom';
import {
  Flex, Box, Link, Heading, VStack, Image, Button
} from '@chakra-ui/react';
import Logo from '../public/Pay_Collected_Logo.png';

export default function FourOhFour() {
  const navigate = useNavigate();
  return (
    <>
      <Flex
        align="center"
        justify="start"
        wrap="wrap"
        w="100%"
        mb={8}
        p={4}
        bg={['white']}
        color={['gray.600']}
        borderBottomWidth="1px"
        borderColor="gray.200"
      >
        <Box display="flex">
          <Link as={ReactLink} to="/">
            <Box w={[180, 300]}>
              <Image
                src={Logo}
                alt="PayCollected Logo"
                fit="cover"
                loading="eager"
              />
            </Box>
          </Link>
        </Box>
      </Flex>
      <VStack spacing="8">
        <Heading size="xl">
          404
        </Heading>
        <Heading size="md">Uh oh! The page you are looking for does not exist.</Heading>
        <Button variant="link" colorScheme="blue" onClick={() => { navigate('/'); }}>
          Back to homepage
        </Button>
      </VStack>
    </>
  );
}
