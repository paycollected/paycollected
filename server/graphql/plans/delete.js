import stripeSDK from 'stripe';
import { GraphQLError } from 'graphql';
import { getProductInfoAndInvoiceUsingPlanId, deletePlan, archivePlan } from '../../db/models.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

export default async function deletePlanResolver(planId, username) {
  let rows;
  try {
    ({ rows } = await getProductInfoAndInvoiceUsingPlanId(planId, username));
  } catch (e) {
    console.log(e);
    throw new GraphQLError('Unable to delete plan', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }
  if (rows.length === 0) {
    throw new GraphQLError('User is not on plan', { extensions: { code: 'FORBIDDEN' } });
  }

  const {
    subscriptionId, invoiceId, prevPriceId, members, planActive, subsActive, planOwner
  } = rows[0];

  if (!planOwner) {
    throw new GraphQLError('Non-plan owner cannot perform this action', { extensions: { code: 'FORBIDDEN' } });
  } else if (!planActive) {
    throw new GraphQLError('Plan has already been archived', { extensions: { code: 'FORBIDDEN' } });
  } else if (!subsActive) {
    throw new GraphQLError('Subscription has already been archived', { extensions: { code: 'FORBIDDEN' } });
  }

  try {
    let promises = [
      stripe.prices.update(prevPriceId, { active: false }),
      stripe.products.update(planId, { active: false }),
      stripe.subscriptions.del(subscriptionId),
    ];
    if (members !== null) {
      promises = promises.concat(members.map((member) => stripe.subscriptions.del(
        member.subscriptionId
      )));
    }
    if (invoiceId === null) {
      await Promise.all([
        ...promises,
        deletePlan(planId),
      ]);
    } else {
      await Promise.all([
        ...promises,
        archivePlan(planId),
      ]);
    }
    return { planId };
  } catch (e) {
    console.log(e);
    throw new GraphQLError('Unable to delete plan', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }
}
