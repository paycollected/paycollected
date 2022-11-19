import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import sgMail from '@sendgrid/mail';
import { GraphQLError } from 'graphql';
import { checkUser, createUser } from '../../db/models';
import { generateConfigEmailVerification } from '../../utils';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
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

    const token = jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) + (60 * 15),
        email,
        name: `${firstName} ${lastName}`,
        username,
        sCusId: null,
      },
      process.env.EMAIL_VERIFY_SECRET_KEY
    );

    const hashPassAndSave = async () => {
      const hashedPass = await bcrypt.hash(password, saltRounds);
      return createUser(firstName, lastName, username, hashedPass, email);
    };

    await Promise.all([
      hashPassAndSave(),
      sgMail.send(generateConfigEmailVerification(`${firstName} ${lastName}`, firstName, email, token)),
    ]);

    return true;
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
