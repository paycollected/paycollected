import { GraphQLError } from 'graphql';
import { checkBeforeTransferOwnership, updatePlanOwner } from '../../db/models';

export default async function transferOwnershipResolver(planId, newOwner, formerOwner) {
  if (newOwner === formerOwner) {
    throw new GraphQLError('Cannot transfer plan ownership to self', { extensions: { code: 'BAD_USER_INPUT' } });
  }

  let rows;
  try {
    ({ rows } = await checkBeforeTransferOwnership(newOwner, planId, formerOwner));
  } catch (e) {
    console.log(e);
    throw new GraphQLError('Unable to transfer plan ownership', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }

  if (rows.length === 0) {
    throw new GraphQLError('User is not an active member of this plan', { extensions: { code: 'FORBIDDEN' } });
  }

  const {
    planActive, subscriptionActive, planOwner, newOwnerUsername
  } = rows[0];
  if (!planActive) {
    throw new GraphQLError('Plan has already been archived', { extensions: { code: 'BAD_USER_INPUT' } });
  } else if (!subscriptionActive) {
    throw new GraphQLError('Subscription has already been archived', { extensions: { code: 'BAD_USER_INPUT' } });
  } else if (!planOwner) {
    throw new GraphQLError('User is not owner of this plan', { extensions: { code: 'FORBIDDEN' } });
  } else if (!newOwnerUsername) {
    throw new GraphQLError('Declared new plan owner is not currently an active member on this plan', { extensions: { code: 'FORBIDDEN' } });
  }

  try {
    const { rows: rowsUpdate } = await updatePlanOwner(newOwner, formerOwner, planId);
    return { planId, newOwner: rowsUpdate[0].newOwner };
  } catch (e) {
    console.log(e);
    throw new GraphQLError('Unable to transfer plan ownership', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }
}
