import dotenv from 'dotenv';
import stripeSDK from 'stripe';
import * as models from '../db/models.js';

dotenv.config();
const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

// update all other active members' subscriptions
// will potentially email members re: change later
async function updateStripePrice(row, price, productTotalQuantity) {
  const {
    username,
    email,
    subscriptionId,
    subscriptionItemId,
    quantity
  } = row;

  if (subscriptionId) {
    // will be null if owner and not active member of plan
    await stripe.subscriptions.update(
      subscriptionId,
      {
        items: [
          {
            id: subscriptionItemId,
            price,
            quantity
          }
        ],
        metadata: { productTotalQuantity },
        proration_behavior: 'none',
      }
    );
  }
}


async function processQuantChangeOnSubsStart(
  productId,
  quantity,
  subscriptionId,
  subscriptionItemId,
  username,
  newPriceId,
  productTotalQuantity,
) {
  const { rows } = await models.startSubscription(
    productId,
    quantity,
    subscriptionId,
    subscriptionItemId,
    username,
    newPriceId
  );
  // save new subscription details (our db),
  // update product w/ new price ID (our db)
  // query all other existing users on this same plan (db)

  if (rows.length > 0) {
    await Promise.all(
      rows.map((row) => updateStripePrice(row, newPriceId, productTotalQuantity))
    );
  }
}


export async function handleSubscriptionStart(setupIntent) {
  // info needed from db: cycleFreq, total count, perCycleCost, startDate for this person,
  // everyone else already on plan
  // also potential create a new price ID
  // API calls: start subscription for this person
  // change subscriptions for existing plan members
  const a = Date.now();
  console.log('----------> setup Intent metadata', setupIntent.metadata);
  if (Object.keys(setupIntent.metadata).length > 0) {
  // only run this if a new subscription is created through our site
  // A new setupIntent is also created and succeeds when a user updates their payment method
    const { customer, payment_method: paymentMethodId } = setupIntent;
    const { planId, username } = setupIntent.metadata;
    const quantity = Number(setupIntent.metadata.quantity);
    try {
      const [
        { rows },
        { invoice_settings: { default_payment_method: defaultPmntMethod } }
      ] = await Promise.all([
        models.subscriptionSetup(planId),
        stripe.customers.retrieve(customer)
      ]);
      const {
        cycleFrequency, perCycleCost, count, prevPriceId, startDate
      } = rows[0];
      const productTotalQuantity = quantity + count;
      const subscription = {
        customer,
        items: [{
          price: prevPriceId,
          quantity,
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
          payment_method_types: ['card'],
        },
        proration_behavior: 'none',
        trial_end: startDate,
        default_payment_method: paymentMethodId,
        metadata: {
          productTotalQuantity,
          cycleFrequency,
          perCycleCost,
          quantChanged: false,
          cancelSubs: false,
        }
      };

      if (count > 0 || quantity > 1) {
        const promises = [
          stripe.prices.create({
            currency: 'usd',
            product: planId,
            unit_amount: Math.ceil(perCycleCost / productTotalQuantity),
            recurring: { interval: cycleFrequency },
            metadata: { deletePlan: false }
          }),
          // create new price ID;
          stripe.prices.update(prevPriceId, { active: false }),
          // archive old price ID
        ];

        if (defaultPmntMethod === null) {
          promises.push(
            stripe.customers.update(
              customer,
              { invoice_settings: { default_payment_method: paymentMethodId } }
            )
            // update the default payment method for this customer
          );
        }
        const [{ id: newPriceId }] = await Promise.all(promises);
        subscription.items[0].price = newPriceId;

        const { id: subscriptionId, items } = await stripe.subscriptions.create(subscription);
        const { id: subscriptionItemId } = items.data[0];

        await processQuantChangeOnSubsStart(
          planId,
          quantity,
          subscriptionId,
          subscriptionItemId,
          username,
          newPriceId,
          productTotalQuantity,
        );
        // write new changes to db
        // and update all existing plan members
      } else {
      // if count = 0, and quantity = 1
      // meaning this is the first subscription on this plan
      // until now (when payment succeeds)
      // --> no need to create a new price ID
      // also no need to archive current price ID
      // no other plan members to update
      // --> also create subscription for this person
      // --> only need to update db
        let subscriptionId;
        let items;

        if (defaultPmntMethod === null) {
          [{ id: subscriptionId, items }] = await Promise.all([
            stripe.subscriptions.create(subscription),
            stripe.customers.update(
              customer,
              { invoice_settings: { default_payment_method: paymentMethodId } }
            )
          ]);
        } else {
          ({ id: subscriptionId, items } = await stripe.subscriptions.create(subscription));
        }
        const { id: subscriptionItemId } = items.data[0];
        await models.startSubscriptionWithNoPriceUpdate(
          planId,
          quantity,
          subscriptionId,
          subscriptionItemId,
          username,
        );
      }
    } catch (e) {
      console.log(e);
    }
    const b = Date.now();
    console.log('--------------> end - start', (b - a) / 1000);
  }
}

export async function handleSubscriptionCancel(subscription) {
  const { id: subscriptionId, items } = subscription;
  const { price, quantity } = items.data[0];
  const { id: prevPriceId, product: productId } = price;
  const { cycleFrequency, newOwner } = subscription.metadata;
  const productTotalQuantity = Number(subscription.metadata.productTotalQuantity);
  const perCycleCost = Number(subscription.metadata.perCycleCost);
  const newProductTotalQuantity = productTotalQuantity - quantity;

  try {
    if (newProductTotalQuantity > 0) {
      // if there are still active members even after this person has dropped out
      const [{ id: newPriceId }, _, __] = await Promise.all([
        stripe.prices.create({
          currency: 'usd',
          product: productId,
          unit_amount: Math.ceil(perCycleCost / newProductTotalQuantity),
          recurring: { interval: cycleFrequency },
          metadata: { deletePlan: false },
        }),
        stripe.prices.update(prevPriceId, { active: false }),
        stripe.subscriptions.del(subscriptionId)
      ]);

      let rows;
      if (!newOwner) {
        ({ rows } = await models.updatePriceIdDelSubsGetMembers(
          newPriceId,
          productId,
          subscriptionId
        ));
        // update product w/ new price ID
        // delete this subscription
        // get all other active members on plan
      } else {
        ({ rows } = await models.updatePriceOwnerDelSubsGetMembers(
          newPriceId,
          productId,
          subscriptionId,
          newOwner
        ));
        // similar as above, w/ addition of updating new plan owner
      }

      if (rows.length > 0) {
        await Promise.all(
          rows.map((row) => updateStripePrice(row, newPriceId, newProductTotalQuantity))
        );
      }
    } else {
      // this is the last active member on plan, there is still a plan owner with quant 0 remaining
      await Promise.all([
        models.deleteSubscription(subscriptionId),
        stripe.subscriptions.del(subscriptionId)
        // we don't archive the price ID here in case more people will be joining in the future
        // which will archive the old price ID in db then
        // or if owner decide to delete plan, price ID is also archived then
      ]);
    }
  } catch (err) {
    console.log(err);
  }
}

export async function handleSubscriptionQuantChange(subscription) {
  const { id: subscriptionId, items, metadata } = subscription;
  const productTotalQuantity = Number(metadata.productTotalQuantity);
  const { prevPriceId } = metadata;
  const { price, quantity } = items.data[0];
  const { id: newPriceId, product: productId } = price;

  try {
    const [{ rows }, _, __] = await Promise.all([
      models.updatePriceQuantGetMembers(productId, subscriptionId, quantity, newPriceId),
      // edit quantity of this subscription in our db & update priceId, also get all members
      stripe.prices.update(prevPriceId, { active: false }),
      // archive old price ID
      stripe.subscriptions.update(subscriptionId, { metadata: { quantChanged: false, prevPriceId: '' } })
      // reset metadata for this subscription
    ]);

    if (rows.length > 0) {
      // update price for all other members
      await Promise.all(rows.map((row) => updateStripePrice(
        row,
        newPriceId,
        productTotalQuantity
      )));
    }
  } catch (err) {
    console.log(err);
  }
}


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


export async function handleDefaultPmntMethodChange(customer) {
  const {
    invoice_settings: { default_payment_method: newMethodId },
    metadata: { username }
  } = customer;
  if (newMethodId !== null) {
    await models.updateDefaultPmntMethod(username, newMethodId);
  }
}
