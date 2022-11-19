import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import stripeSDK from 'stripe';
import { GraphQLError } from 'graphql';
import { getUserInfoCheckNewUsername, changeUsername } from '../../db/models';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

export default async function changeUsernameResolver(username, password, newUsername) {
  let stripeCusId;
  let savedPwd;
  let newUsernameInput;
  try {
    ({
      rows: [{ stripeCusId, savedPwd, newUsernameInput }]
    } = await getUserInfoCheckNewUsername(username, newUsername));
  } catch (e) {
    console.log(e);
    throw new GraphQLError('Unable to change username', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }

  let result;
  try {
    result = await bcrypt.compare(password, savedPwd);
  } catch (e) {
    console.log(e);
    throw new GraphQLError('Unable to change username', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }

  if (!result) {
    throw new GraphQLError('Incorrect password', { extensions: { code: 'BAD_USER_INPUT' } });
  }

  if (username === newUsername) {
    throw new GraphQLError('No change in username', { extensions: { code: 'BAD_USER_INPUT' } });
  } else if (newUsernameInput !== null) {
    throw new GraphQLError('Username already taken', { extensions: { code: 'BAD_USER_INPUT' } });
  }

  const token = jwt.sign({
    exp: Math.floor(Date.now() / 1000) + (60 * 30),
    user: {
      username: newUsername,
      stripeCusId,
    }
  }, process.env.SIGNIN_SECRET_KEY);

  try {
    await Promise.all([
      changeUsername(username, newUsername),
      stripe.customers.update(stripeCusId, { metadata: { username: newUsername } })
    ]);
    return { username: newUsername, token };
  } catch (e) {
    console.log(e);
    throw new GraphQLError('Unable to change username', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }
}
