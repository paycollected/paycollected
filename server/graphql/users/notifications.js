import { GraphQLError } from 'graphql';
import { getNotifications, markNotificationAsRead } from '../../db/models';

export async function retrieveNotificationsResolver(user) {
  try {
    const { rows } = await getNotifications(user);
    return rows[0];
  } catch (e) {
    throw new GraphQLError('Unable to retrieve notifications', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }
}

export async function deleteNotificationResolver(notificationId, user) {
  let rows;
  try {
    ({ rows } = await markNotificationAsRead(notificationId, user));
  } catch (e) {
    throw new GraphQLError('Unable to delete notifications', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }

  if (rows.length === 0) {
    throw new GraphQLError("Notification doesn't belong to user", { extensions: { code: 'FORBIDDEN' } });
  }
  return notificationId;
}
