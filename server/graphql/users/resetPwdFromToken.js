import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { GraphQLError } from 'graphql';
import { changePassword } from '../../db/models';

export default async function resetPwdFromTokenResolver(token, newPwd, saltRounds) {
  let username;
  let stripeCusId;
  try {
    ({ user: { username, stripeCusId } } = jwt.verify(token, process.env.RESET_PWD_SECRET_KEY));
  } catch (e) {
    throw new GraphQLError('Incorrect token', { extensions: { code: 'FORBIDDEN' } });
  }

  try {
    const hashedPass = await bcrypt.hash(newPwd, saltRounds);
    await changePassword(username, hashedPass);
    const loginToken = jwt.sign({
      exp: Math.floor(Date.now() / 1000) + (60 * 30),
      user: { username, stripeCusId },
    }, process.env.SIGNIN_SECRET_KEY);
    return { token: loginToken, username };
  } catch (e) {
    console.log(e);
    throw new GraphQLError('Unable to change password', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }
}
