import React, { useEffect } from 'react';
import { Flex } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import NavBar from '../../components/NavBar.jsx';
import { SuccessfulPaymentData as SUBS_INFO } from '../../graphql/queries.gql';

const queryStr = window.location.search;
let returnedSetupIntentId;
if (queryStr.length > 0) {
  const urlParams = new URLSearchParams(queryStr);
  returnedSetupIntentId = urlParams.get('setup_intent');
}

export default function CheckoutSuccess({
  user, setUser, setPlanToJoin, setPlanToView, setStripeClientSecret, setSetupIntentId,
}) {
  const navigate = useNavigate();

  useEffect(() => {
    setStripeClientSecret(null);
    setSetupIntentId(null);
    if (!returnedSetupIntentId || !/^seti_(?:[a-zA-Z0-9]{24})$/.test(returnedSetupIntentId)) {
      navigate('/404');
    }
  }, []);

  const { loading, data, error } = useQuery(SUBS_INFO, {
    variables: { setupIntentId: returnedSetupIntentId },
  });

  if (data) {
    const {
      planName, cycleFrequency, nextBillDate, personalCost, paymentMethod
    } = data;

    return (
      <Flex
        w="100%"
        minHeight="100vh"
        h="max-content"
        bg="#F5F5F5"
        align="center"
        direction="column"
      >
        <NavBar
          user={user}
          setUser={setUser}
          setPlanToJoin={setPlanToJoin}
          setPlanToView={setPlanToView}
        />
      </Flex>
    );
  }
  return null;
}
