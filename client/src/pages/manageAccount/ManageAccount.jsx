import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useForm } from 'react-hook-form';
import {
  FormControl, FormLabel, Input, Button, FormErrorMessage, Flex, Box, IconButton,
  VStack, Heading, TableContainer, Table, Tbody, Tr, Td, useBreakpointValue, useDisclosure
} from '@chakra-ui/react';
import { EditIcon } from '@chakra-ui/icons';
import { GetEmail as GET_EMAIL } from '../../graphql/queries.gql';
import NavBar from '../../components/NavBar.jsx';
import ChangeEmailModal from './ChangeEmailModal.jsx';
import ChangeUsernameModal from './ChangeUsernameModal.jsx';
import ChangePasswordModal from './ChangePasswordModal.jsx';

export default function ManageAccount({
  user, setUser, setPlanToJoin, setPlanToView
}) {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const {
    isOpen: isOpenUsername,
    onOpen: onOpenUsername,
    onClose: onCloseUsername
  } = useDisclosure();
  const {
    isOpen: isOpenEmail,
    onOpen: onOpenEmail,
    onClose: onCloseEmail
  } = useDisclosure();
  const {
    isOpen: isOpenPassword,
    onOpen: onOpenPassword,
    onClose: onClosePassword
  } = useDisclosure();
  const [action, setAction] = useState('password');
  const [status, setStatus] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');

  const {
    loading: getEmailLoading, data: getEmailData, error: getEmailError
  } = useQuery(GET_EMAIL, {
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-only',
  });

  useEffect(() => {
    setUsername(getEmailData?.getEmail.username);
    setEmail(getEmailData?.getEmail.email);
  }, [getEmailData]);

  // const onSubmit = (data) => {
  //   let newUsername;
  //   let password;
  //   let newEmail;
  //   let newPassword;
  //   let currentPassword;
  //   switch (action) {
  //     case 'username':
  //       ({ newUsername, currentPassword: password } = data);
  //       changeUsername({ variables: { newUsername, password } });
  //       break;
  //     case 'email':
  //       ({ newEmail, currentPassword: password } = data);
  //       setEmail(newEmail);
  //       changeEmail({ variables: { newEmail, password } });
  //       break;
  //     default:
  //       ({ newPassword, currentPassword } = data);
  //       changePassword({ variables: { newPassword, currentPassword }});
  //       break;
  //   }
  // };
  return (
    <>
      <NavBar
        user={user}
        setUser={setUser}
        setPlanToJoin={setPlanToJoin}
        setPlanToView={setPlanToView}
      />
      <VStack w="93%" align="left" spacing={{ base: '6', md: '10' }} mb="10">
        <Heading as="h1" fontSize="3xl">Profile</Heading>
        <TableContainer width="75%">
          <Table variant="unstyled" size={isMobile ? 'sm' : 'md'}>
            <Tbody>
              <Tr>
                <Td fontWeight="bold">Username</Td>
                <Td>{getEmailData ? username : <Button isLoading variant="outline" size="sm" />}</Td>
                <Td>
                  {isMobile
                    ? <IconButton variant="outline" size="sm" icon={<EditIcon />} onClick={onOpenUsername} />
                    : (
                      <Button rightIcon={<EditIcon />} size="sm" variant="outline" onClick={onOpenUsername}>
                        Edit
                      </Button>
                    )}
                </Td>
              </Tr>
              <Tr>
                <Td fontWeight="bold">Email</Td>
                <Td>{getEmailData ? email : <Button isLoading variant="outline" size="sm" />}</Td>
                <Td>
                  {isMobile
                    ? <IconButton variant="outline" size="sm" icon={<EditIcon />} onClick={onOpenEmail} />
                    : (
                      <Button rightIcon={<EditIcon />} size="sm" variant="outline" onClick={onOpenEmail}>
                        Edit
                      </Button>
                    )}
                </Td>
              </Tr>
            </Tbody>
          </Table>
        </TableContainer>
      </VStack>
      <Button onClick={onOpenPassword}>Change password</Button>
      {getEmailData
        && (
        <>
          <ChangeUsernameModal
            isOpen={isOpenUsername}
            onClose={onCloseUsername}
            username={username}
            setUsername={setUsername}
          />
          <ChangeEmailModal
            isOpen={isOpenEmail}
            onClose={onCloseEmail}
            email={email}
            setEmail={setEmail}
          />
          <ChangePasswordModal
            isOpen={isOpenPassword}
            onClose={onClosePassword}
          />
        </>
        )}
      {/* {status === 'error' && (<div>{errMsg}</div>)}
      {status === 'success' && action === 'email' && (
        <div>
          <div>
            Your request has been successfully submitted.
            Please follow the instructions sent to this new address to complete the verification process.
          </div>
          <div>
            Still haven&apos;t received the email?
            <Button type="button" onClick={reverify}>Resend it!</Button>
          </div>
        </div>
      )}
      {status === 'resent' && (
        <div>
          <div>
          {`Another verification has been sent to ${email}. Please check your mailbox, including the spam folder.`}
          </div>
          <div>If you&apos;re still having trouble, please contact us at admin@paycollected.com for support.</div>
        </div>
      )}
      {status === 'success' && action === 'password' && (
        <div>{
          `Your password has been changed successfully.
          You will need to use this new password the next time logging in.`
        }</div>
      )}
      {status === 'success' && action === 'username' && (
        <div>Your username has been changed successfully.</div>
      )}
      <Flex width="full" align="center" justifyContent="left">
        <Button onClick={() => { setAction('password'); }}>Change password</Button>
        <Button onClick={() => { setAction('username'); }}>Change username</Button>
        <Button onClick={() => { setAction('email'); }}>Change email</Button>
      </Flex>
      <Box w="50%">
        <form onSubmit={handleSubmit(onSubmit)}>
          {action === 'password' && (
            <>
              <FormControl isRequired isInvalid={errors.newPassword}>
                <FormLabel>New Password</FormLabel>
                <Input
                  {...register('newPassword', {
                    required: 'Missing new password input',
                    validate: (val) => val !== getValues('currentPassword') || 'New password must be different from current password',
                  })}
                  type="password"
                />
                {errors.newPassword && (
                  <FormErrorMessage>{errors.newPassword.message}</FormErrorMessage>
                )}
              </FormControl>
              <FormControl isRequired isInvalid={errors.newPassword2}>
                <FormLabel>Confirm New Password</FormLabel>
                <Input
                  {...register('newPassword2', {
                    required: 'Missing new password confirmation',
                    validate: (val) => val === getValues('newPassword') || "New password inputs don't match",
                  })}
                  type="password"
                />
                {errors.newPassword2 && (
                  <FormErrorMessage>{errors.newPassword2.message}</FormErrorMessage>
                )}
              </FormControl>
            </>
          )}
          {action === 'username' && (
            <FormControl isRequired isInvalid={errors.newUsername}>
              <FormLabel>New Username</FormLabel>
              <Input
                {...register('newUsername', {
                  required: 'Missing new username',
                  validate: (val) => val !== user || 'New username must be different from current username',
                })}
                type="text"
              />
              {errors.newUsername && (
                <FormErrorMessage>{errors.newUsername.message}</FormErrorMessage>
              )}
            </FormControl>
          )}
          {action === 'email' && (
            <FormControl isRequired isInvalid={errors.newEmail}>
              <FormLabel>New Email</FormLabel>
              <Input {...register('newEmail', { required: 'Missing new email'})} type="email" />
              {errors.newEmail && (
                <FormErrorMessage>{errors.newEmail.message}</FormErrorMessage>
              )}
            </FormControl>
          )}
          <FormControl isRequired isInvalid={errors.currentPassword}>
            <FormLabel>Current Password</FormLabel>
            <Input
              {...register('currentPassword', { required: 'Missing current password input' })}
              type="password"
            />
            {errors.currentPassword && (
              <FormErrorMessage>{errors.currentPassword.message}</FormErrorMessage>
            )}
          </FormControl>
          <Button type="submit">Submit</Button>
        </form>
      </Box> */}
    </>
  );
}
