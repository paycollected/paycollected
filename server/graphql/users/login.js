import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ApolloError, UserInputError } from 'apollo-server-core';
import { getUserInfo } from '../../db/models.js';

export default async function loginResolver(username, password) {
  let errMsg;
  username = username.trim().toLowerCase();
  try {
    const { rows } = await getUserInfo(username);
    // if username does not exist, throw error
    if (rows.length === 0) {
      errMsg = 'This username does not exist';
      throw new Error();
    }
    // if username exists but password doesn't match, return null
    const { password: savedPass, stripeCusId } = rows[0];
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
    }, process.env.SECRET_KEY);

    return { username, token };
  } catch (asyncError) {
    if (errMsg) {
      // if anticipated bad input error
      throw new UserInputError(errMsg);
    } else {
      // catch all from rest of async
      console.log(asyncError);
      throw new ApolloError('Unable to log in');
    }
  }
}
