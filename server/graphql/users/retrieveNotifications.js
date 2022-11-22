import { GraphQLError } from 'graphql';
import { getNotifications } from '../../db/models';

export default async function retrieveNotificationsResolver(user) {
  try {
    const { rows } = await getNotifications(user);
    return rows[0];
  } catch (e) {
    throw new GraphQLError('Unable to retrieve notifications', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }
}
