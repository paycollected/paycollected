import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Heading, Divider } from '@chakra-ui/react';

export default function Home({ setPlanToJoin, }) {
  const { planId } = useParams();

  useEffect(() => {
    if (planId) {
      setPlanToJoin(planId.toString().trim());
    }
  }, []);

  return (
    <div>
      <h1>This is the Home page</h1>
      <Heading my={5}>
        Info About App
      </Heading>
      <Divider />
      <Heading my={5}>
        Sign Up
      </Heading>
      <Divider />
      <Heading my={5}>
        Contact Us
      </Heading>
    </div>
  );
}
