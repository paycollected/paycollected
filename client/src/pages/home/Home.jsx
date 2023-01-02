import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Heading, Divider } from '@chakra-ui/react';
import NavBar from '../../components/NavBar.jsx';

export default function Home({ user, setUser, setPlanToJoin, setPlanToView }) {
  const { planId } = useParams();

  useEffect(() => {
    if (planId) {
      setPlanToJoin(planId.toString().trim());
    }
  }, []);

  return (
    <>
      <NavBar
        user={user}
        setUser={setUser}
        setPlanToJoin={setPlanToJoin}
        setPlanToView={setPlanToView}
      />
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
    </>
  );
}
