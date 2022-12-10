import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import {
  Flex, Box, Grid, GridItem, Heading, Button, useClipboard, UnorderedList, ListItem, Tooltip,
  ButtonGroup, Container, HStack, Icon, Input, InputGroup, InputLeftElement, Stack, Text,
  useBreakpointValue, useColorModeValue,
} from '@chakra-ui/react';
import { CopyIcon } from '@chakra-ui/icons';
import PlansTable from './PlansTable.jsx';
import { ViewAllPlans as GET_ALL_PLANS } from '../../graphql/queries.gql';
import ConfirmCancel from '../planDetails/ConfirmCancel.jsx';
import ModifyQuantity from '../planDetails/ModifyQuantity.jsx';
import ConfirmDeletePlan from '../planDetails/ConfirmDeletePlan.jsx';

export default function PlansTableLayout({ total, plans }) {
  // const [planToCopy, setPlanToCopy] = useState(null);
  // const { hasCopied, onCopy, setValue } = useClipboard('');
  const isMobile = useBreakpointValue({ base: true, md: false });

  // useEffect(() => { setValue(`${process.env.HOST}/join/${planToCopy}`); }, [planToCopy, setValue]);

  // const { loading, data, error } = useQuery(GET_ALL_PLANS, {
  //   fetchPolicy: 'cache-and-network',
  //   nextFetchPolicy: 'cache-only',
  // });

  return (
    <Container py={{ base: '4', md: '8' }} px={{ base: '0', md: 8 }}>
      <Box
        bg="bg-surface"
        boxShadow={{ base: 'none', md: useColorModeValue('sm', 'sm-dark') }}
        borderRadius={useBreakpointValue({ base: 'none', md: 'lg' })}
      >
        <Stack spacing="5">
          <Box overflowX="auto">
            <PlansTable plans={plans} />
          </Box>
          <Box px={{ base: '4', md: '6' }} pb="5">
            <HStack spacing="3" justify="space-between">
              {!isMobile && (
                <Text color="muted" fontSize="sm">
                  {`Showing 1 to 5 of ${total} results`}
                </Text>
              )}
              <ButtonGroup
                spacing="3"
                justifyContent="space-between"
                width={{ base: 'full', md: 'auto' }}
                variant="secondary"
              >
                <Button>Previous</Button>
                <Button>Next</Button>
              </ButtonGroup>
            </HStack>
          </Box>
        </Stack>
      </Box>
    </Container>
  );
}
