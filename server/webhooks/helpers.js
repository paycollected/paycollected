import stripeSDK from 'stripe';
import * as models from '../db/models.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);


async function cancelSubsAndNotify(row) {
  const {
    firstName,
    email,
    subscriptionId,
  } = row;

  if (subscriptionId) {
    await stripe.subscriptions.del(subscriptionId);
  }
}


export async function handlePlanDelete(price) {
  // archive product

  const { product: productId } = price;

  try {
    const [{ rows }, _] = await Promise.all([
      models.deletePlanGetAllSubs(productId),
      // cancel subscriptions for ALL members on plan
      // delete product in db
      stripe.products.update(productId, { active: false })
      // archive product
    ]);

    if (rows.length > 0) {
      await Promise.all(rows.map((row) => cancelSubsAndNotify(row)));
    }
  } catch (e) {
    console.log(e);
  }
}
