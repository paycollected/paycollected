import bcrypt from 'bcrypt';
import { GraphQLError } from 'graphql';
import { getUserInfo, changePassword } from '../../db/models';

export default async function changePasswordResolver(username, currPwd, newPwd, saltRounds) {
  let password;
  try {
    ({ rows: [{ password }] } = await getUserInfo(username));
  } catch (e) {
    console.log(e);
    throw new GraphQLError('Unable to change password', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }

  let result;
  try {
    result = await bcrypt.compare(currPwd, password);
  } catch (e) {
    console.log(e);
    throw new GraphQLError('Unable to change password', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }

  if (!result) {
    throw new GraphQLError('Incorrect password', { extensions: { code: 'BAD_USER_INPUT' } });
  }

  try {
    const hashedPass = await bcrypt.hash(newPwd, saltRounds);
    await changePassword(username, hashedPass);
    return true;
  } catch (e) {
    console.log(e);
    throw new GraphQLError('Unable to change password', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }
}
