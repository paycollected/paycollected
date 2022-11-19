import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import { getUserInfoEitherUsernameOrEmail } from '../../db/models';

export default async function loginResolver(usernameOrEmailInput, password) {
  let errMsg;
  const usernameOrEmail = usernameOrEmailInput.trim().toLowerCase();
  try {
    const { rows } = await getUserInfoEitherUsernameOrEmail(usernameOrEmail);
    // if username does not exist, throw error
    if (rows.length === 0) {
      errMsg = 'This account does not exist';
      throw new Error();
    }

    const {
      savedPass, stripeCusId, verified, username
    } = rows[0];
    // if unverified account, do not allow to log in
    if (!verified) {
      errMsg = 'Account exists but email still needs verification';
      throw new Error();
    }
    // if username exists but password doesn't match, return null
    const result = await bcrypt.compare(password, savedPass);
    if (!result) {
      return null;
    }

    // if password is correct, return a signed token so user can sign in
    const token = jwt.sign({
      // expires after 30 mins
      exp: Math.floor(Date.now() / 1000) + (60 * 30),
      user: {
        username,
        stripeCusId,
      }
    }, process.env.SIGNIN_SECRET_KEY);

    return { username, token };
  } catch (asyncError) {
    if (errMsg) {
      // if anticipated bad input error
      throw new GraphQLError(errMsg, { extensions: { code: 'BAD_USER_INPUT' } });
    } else {
      // catch all from rest of async
      console.log(asyncError);
      throw new GraphQLError('Unable to log in', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
    }
  }
}
