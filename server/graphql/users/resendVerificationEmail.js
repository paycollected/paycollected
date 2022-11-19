import jwt from 'jsonwebtoken';
import sgMail from '@sendgrid/mail';
import { GraphQLError } from 'graphql';
import { checkBeforeVerifyEmail } from '../../db/models';
import { generateConfigEmailVerification } from '../../utils';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default async function resendVerificationEmailResolver(email) {
  let rows;
  try {
    ({ rows } = await checkBeforeVerifyEmail(email));
  } catch (e) {
    console.log(e);
    throw new GraphQLError('Unable to send verification email', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }

  if (rows.length === 0) {
    throw new GraphQLError('No account associated with this email was found.', { extensions: { code: 'BAD_USER_INPUT' } });
  }

  const {
    verified, firstName, name, username, sCusId
  } = rows[0];
  if (verified) {
    throw new GraphQLError('This email has already been verified.', { extensions: { code: 'BAD_USER_INPUT' } });
  }

  const token = jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + (60 * 15), email, name, username, sCusId,
    },
    process.env.EMAIL_VERIFY_SECRET_KEY
  );

  try {
    await sgMail.send(generateConfigEmailVerification(name, firstName, email, token));
    return true;
  } catch (e) {
    console.log(e);
    throw new GraphQLError('Unable to send verification email', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }
}
