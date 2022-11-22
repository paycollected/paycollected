import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import {
  Button, FormControl, FormLabel, Input, Heading
} from '@chakra-ui/react';
import { RetrieveNotifications as GET_NOTIFICATIONS } from '../graphql/queries.gql';
import { DeleteNotification as DELETE_NOTI } from '../graphql/mutations.gql';

// actual redirect URL string 'http://localhost:5647/dashboard/?setup_intent=seti_1Lq9rqAJ5Ik974ueIdg7WHn9&setup_intent_client_secret=seti_1Lq9rqAJ5Ik974ueIdg7WHn9_secret_MZISJyXsMF6na4pA6ryaqOfvt8JbeGa&redirect_status=succeeded'
const queryStr = window.location.search;
let username;
let token;
let redirectStatus;
if (queryStr.length > 0) {
  const urlParams = new URLSearchParams(queryStr);
  username = urlParams.get('username');
  token = urlParams.get('token');
  redirectStatus = urlParams.get('redirect_status');
}

export default function Dashboard({ user, setUser }) {
  const navigate = useNavigate();
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [code, setCode] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const { data } = useQuery(GET_NOTIFICATIONS, {
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-only',
  });

  const [deleteNoti, { loading }] = useMutation(DELETE_NOTI, {
    update: (cache, { data: { deleteNotification: id } }) => {
      cache.modify({
        fields: {
          retrieveNotifications(obj) {
            const { count, notifications } = obj;
            return { count, notifications: notifications.filter((noti) => noti.__ref !== `Notification:${id}`) };
          },
        }
      });
    },
    onError: ({ message }) => { console.log(message); },
  });

  useEffect(() => {
    if (user === null && !!username && !!token) {
      setUser(username);
      localStorage.setItem('token', token);
    } else if (user === null) {
      navigate('/');
    }
  }, []);

  const codeInputSubmit = (e) => {
    e.preventDefault();
    const formattedCode = code.toString().trim();
    setCode(formattedCode);
    navigate(`/join/${formattedCode}`);
  };

  return (
    <div>
      <Heading>
        {user}
        &apos;s Dashboard
      </Heading>
      <Button onClick={() => { navigate('/plan/create'); }}>Create a New Plan</Button>
      <Button onClick={() => { navigate('/plan/all'); }}>Your Current Plans</Button>
      <Button onClick={() => { navigate('/manage-account'); }}>Manage Your Account</Button>
      <Button onClick={() => { setShowCodeInput(true); }}>Have a Code? Join a Plan!</Button>
      <div>
        {showCodeInput && (
        <div>
          <form onSubmit={codeInputSubmit}>
            <FormControl
              isRequired
              my={2}
            >
              <FormLabel>Plan Code</FormLabel>
              <Input
                type="text"
                width="50%"
                bg="white"
                placeholder="Enter Code"
                value={code}
                onChange={(e) => { setCode(e.target.value); }}
              />
            </FormControl>
            <Button type="submit">Join!</Button>
            <Button onClick={() => { setShowCodeInput(false); }}>Cancel</Button>
          </form>
        </div>
        )}
      </div>
      {data && data.retrieveNotifications.count > 0 && (
        <div>
          <div>
            {`You have ${data.retrieveNotifications.count} notifications`}
            {console.log(showNotifications)}
          </div>
          <button type="button" onClick={() => setShowNotifications(!showNotifications)}>{`${!showNotifications ? 'Show' : 'Hide'} notifications`}</button>
          {showNotifications && (
            <div>
              {data.retrieveNotifications.notifications.map((noti) => (
                <div key={noti.id}>
                  <div style={{ font: '14px' }}>{noti.content}</div>
                  <div style={{ font: '10px', fontStyle: 'italic' }}>{noti.createdAt}</div>
                  <Button onClick={() => deleteNoti({ variables: { notificationId: noti.id } })}>
                    Mark as read
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
