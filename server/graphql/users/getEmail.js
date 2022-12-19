import { GraphQLError } from 'graphql';
import { checkUser } from '../../db/models';

export default async function getEmailResolver(username) {
  let errMsg;
  try {
    const { rows } = await checkUser(username, '');
    if (rows.length === 0) {
      errMsg = 'This username does not exist';
      throw new Error();
    }
    return rows[0];
  } catch (asyncError) {
    if (errMsg) {
      throw new GraphQLError(errMsg, { extensions: { code: 'BAD_USER_INPUT' } });
    } else {
      console.log(asyncError);
      throw new GraphQLError('Unable to get email', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
    }
  }
}
