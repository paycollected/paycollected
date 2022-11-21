import sgMail from '@sendgrid/mail';
import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import { getUserInfoEitherUsernameOrEmail } from '../../db/models';
import { generateConfigPwdReset } from '../../utils';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default async function resetPasswordResolver(usernameOrEmailInput) {
  const usernameOrEmail = usernameOrEmailInput.trim().toLowerCase();
  let rows;
  try {
    ({ rows } = await getUserInfoEitherUsernameOrEmail(usernameOrEmail));
  } catch (e) {
    console.log(e);
    throw new GraphQLError('Unable to send reset password', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }

  if (rows.length === 0) {
    throw new GraphQLError('This account does not exist', { extensions: { code: 'BAD_USER_INPUT' } });
  }
  const {
    verified, email, firstName, name, username, stripeCusId,
  } = rows[0];
  if (!verified) {
    throw new GraphQLError('The email associated with this account has not been verified yet.', { extensions: { code: 'BAD_USER_INPUT' } });
  }

  const token = jwt.sign({
    exp: Math.floor(Date.now() / 1000) + (60 * 15),
    user: { username, stripeCusId },
  }, process.env.RESET_PWD_SECRET_KEY);
  try {
    await sgMail.send(generateConfigPwdReset(name, firstName, email, token));
    return true;
  } catch (e) {
    console.log(e);
    throw new GraphQLError('Unable to send reset password', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }
}
