import stripeSDK from 'stripe';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
  ApolloError, UserInputError, ForbiddenError
} from 'apollo-server-core';
import { checkUser, createUser } from '../../db/models.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);
const saltRounds = 10;

export default async function createAccount(firstName, lastName, username, password, email) {
  let errMsg;
  username = username.trim().toLowerCase();
  email = email.trim().toLowerCase();
  try {
    const { rows } = await checkUser(username, email);
    // username and email do not exist -> create user
    if (rows.length === 0) {
      const [
        { id: stripeCusId },
        hashedPass
      ] = await Promise.all([
        stripe.customers.create({
          name: `${firstName} ${lastName}`,
          email
        }),
        bcrypt.hash(password, saltRounds)
      ]);

      await createUser(firstName, lastName, username, hashedPass, email, stripeCusId);
      const token = jwt.sign({
        // expires after 2 weeks
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 14),
        // storing user's info in token so we can easily obtain it from context in any resolver
        user: {
          username,
          email,
          stripeCusId,
        }
      }, process.env.SECRET_KEY);
      return { username, email, token };
    // username or email exist --> return error
    } else if (rows[0].username === username) {
      errMsg = 'This username already exists';
      throw new Error();
    } else {
      errMsg = 'This email already exists';
      throw new Error();
    }
  } catch (asyncError) {
    /*
    Because this entire process depends on many async operations
    (2 database queries + 1 bcrypt here),
    this catch block will catch ALL errors from any of these async operations
    and throw a generic error message.
    According to Apollo docs, this should generate an error with code 'INTERNAL_SERVER_ERROR'.
    */

    // if this is an anticipated bad input error
    if (errMsg) {
      throw new UserInputError(errMsg);
    } else {
    // catch all from the rest of async operations
      console.log(asyncError);
      throw new ApolloError('Unable to create user');
    }
  }
}
