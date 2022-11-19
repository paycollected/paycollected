import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import sgMail from '@sendgrid/mail';
import { GraphQLError } from 'graphql';
import { getUserInfoCheckNewEmail, changeEmail } from '../../db/models';
import { generateConfigEmailVerification } from '../../utils';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default async function changeEmailResolver(username, password, newEmail) {
  let email;
  let savedPwd;
  let firstName;
  let name;
  let newEmailInput;
  let sCusId;
  try {
    ({
      rows: [{
        email, savedPwd, firstName, name, newEmailInput, sCusId,
      }]
    } = await getUserInfoCheckNewEmail(username, newEmail));
  } catch (e) {
    console.log(e);
    throw new GraphQLError('Unable to change email', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }

  let result;
  try {
    result = await bcrypt.compare(password, savedPwd);
  } catch (e) {
    console.log(e);
    throw new GraphQLError('Unable to change email', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }

  if (!result) {
    throw new GraphQLError('Incorrect password', { extensions: { code: 'BAD_USER_INPUT' } });
  }

  if (email === newEmail) {
    throw new GraphQLError('No change in email', { extensions: { code: 'BAD_USER_INPUT' } });
  } else if (newEmailInput !== null) {
    throw new GraphQLError('Email already taken', { extensions: { code: 'BAD_USER_INPUT' } });
  }

  const token = jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + (60 * 15), email: newEmail, name, username, sCusId
    },
    process.env.EMAIL_VERIFY_SECRET_KEY
  );

  try {
    await Promise.all([
      changeEmail(username, newEmail),
      sgMail.send(generateConfigEmailVerification(name, firstName, newEmail, token, 'returning'))
    ]);
    return true;
  } catch (e) {
    console.log(e);
    throw new GraphQLError('Unable to change email', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }
}
