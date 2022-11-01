import stripeSDK from 'stripe';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import { checkUser, createUser } from '../../db/models.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);
const saltRounds = 10;

export default async function createAccount(
  firstName,
  lastName,
  inputUsername,
  password,
  inputEmail
) {
  let errMsg;
  const username = inputUsername.trim().toLowerCase();
  const email = inputEmail.trim().toLowerCase();
  try {
    const { rows } = await checkUser(username, email);
    // username or email exist --> return error
    if (rows.length > 0 && rows[0].username === username) {
      errMsg = 'This username already exists';
      throw new Error();
    } else if (rows.length > 0) {
      errMsg = 'This email already exists';
      throw new Error();
    }

    // username and email do not exist -> create user
    const [
      { id: stripeCusId },
      hashedPass
    ] = await Promise.all([
      stripe.customers.create({
        name: `${firstName} ${lastName}`,
        email,
        metadata: { username }
      }),
      bcrypt.hash(password, saltRounds)
    ]);

    await createUser(firstName, lastName, username, hashedPass, email, stripeCusId);
    const token = jwt.sign(
      {
        // expires after 30 mins
        exp: Math.floor(Date.now() / 1000) + (60 * 30),
        // storing user's info in token so we can easily obtain it from context in any resolver
        user: { username, stripeCusId }
      },
      process.env.SECRET_KEY
    );
    return { username, token };
  } catch (asyncError) {
    // if this is an anticipated bad input error
    if (errMsg) {
      throw new GraphQLError(errMsg, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
    } else {
    // catch all from the rest of async operations
      console.log(asyncError);
      throw new GraphQLError('Unable to create user', { extensions: { code: 'BAD_USER_INPUT' } });
    }
  }
}
