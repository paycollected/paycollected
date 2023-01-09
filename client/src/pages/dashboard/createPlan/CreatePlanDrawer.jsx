import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import {
  useBreakpointValue, useClipboard, Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton,
} from '@chakra-ui/react';
import { CreatePlanMutation as CREATE_PLAN } from '../../../graphql/mutations.gql';
import { ViewAllPlans as GET_PLANS } from '../../../graphql/queries.gql';
import CreatePlanForm from './CreatePlanForm.jsx';
import CreatePlanSuccess from './CreatePlanSuccess.jsx';

export default function CreatePlanDrawer({ isOpen, onClose, setPlanToJoin }) {
  const isMobile = useBreakpointValue({ base: true, md: false });
  // conditionally render create plan form vs success page
  const [success, setSuccess] = useState(false);
  // data from successfully created plan
  const [planNameCreated, setPlanName] = useState('');
  const [perCycleCostCreated, setPerCycleCost] = useState('');
  const [billingFrequencyCreated, setBillingFrequency] = useState('');
  const [startDateCreated, setStartDateCreated] = useState('');
  const [planCode, setPlanCode] = useState('');

  const { onCopy: onCopyURL, setValue: setValueURL } = useClipboard('');
  const { onCopy: onCopyCode, setValue: setValueCode } = useClipboard('');

  useEffect(() => {
    setValueURL(`${process.env.HOST}/join/${planCode}`);
    setValueCode(planCode);
  }, [planCode]);

  const [createNewPlan, { loading, error }] = useMutation(CREATE_PLAN, {
    onCompleted: ({
      createPlan: {
        planId, planName, cycleFrequency, startDate: returnedStartDate, perCycleCost
      }
    }) => {
      const dateSplit = returnedStartDate.split('-');
      setPlanToJoin(planId);
      setPlanName(planName);
      setPerCycleCost(perCycleCost);
      setBillingFrequency(cycleFrequency[0].concat(cycleFrequency.slice(1).toLowerCase()));
      setStartDateCreated(`${dateSplit[1]}/${dateSplit[2]}/${dateSplit[0]}`);
      setPlanCode(planId);
      setSuccess(true);
    },
    onError: ({ message }) => {
      console.log('error creating plan: ', message);
      setSuccess(false);
    },
    refetchQueries: [{ query: GET_PLANS }, 'ViewAllPlans'],
  });

  const onCloseDrawer = () => {
    setSuccess(false);
    setPlanName('');
    setPerCycleCost('');
    setBillingFrequency('');
    setStartDateCreated('');
    setPlanCode('');
    setPlanToJoin(null);
    onClose();
  };

  return (
    <Drawer isOpen={isOpen} onClose={onCloseDrawer} placement="right" size={isMobile ? 'full' : 'md'}>
      <DrawerOverlay />
      <DrawerContent px={2} py={2}>
        <DrawerCloseButton />
        {/* create plan form vs success page */}
        {!success ? (
          <CreatePlanForm
            createNewPlan={createNewPlan}
            onCloseDrawer={onCloseDrawer}
            loading={loading}
          />
        ) : (
          <CreatePlanSuccess
            planNameCreated={planNameCreated}
            perCycleCostCreated={perCycleCostCreated}
            billingFrequencyCreated={billingFrequencyCreated}
            startDateCreated={startDateCreated}
            planCode={planCode}
            onCloseDrawer={onCloseDrawer}
            onCopyCode={onCopyCode}
            onCopyURL={onCopyURL}
          />
        )}
      </DrawerContent>
    </Drawer>
  );
}
