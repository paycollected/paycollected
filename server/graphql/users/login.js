import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import { getUserInfo } from '../../db/models.js';

export default async function loginResolver(inputUsername, password) {
  let errMsg;
  const username = inputUsername.trim().toLowerCase();
  try {
    const { rows } = await getUserInfo(username);
    // if username does not exist, throw error
    if (rows.length === 0) {
      errMsg = 'This username does not exist';
      throw new Error();
    }

    const { password: savedPass, stripeCusId, verified } = rows[0];
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
