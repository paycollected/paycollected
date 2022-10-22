import stripeSDK from 'stripe';
import { ApolloError } from 'apollo-server-core';
import {
  viewOnePlan as viewOnePlanModel,
  viewAllPlans as viewAllPlansModel,
  membersOnOnePlan
} from '../../db/models.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

export async function viewOnePlan(planId, username) {
  let errMsg;

  try {
    const { rows } = await viewOnePlanModel(planId, username);
    if (rows.length === 0) { // no match
      errMsg = 'No plan matched search';
      throw new Error();
    }
    const result = { ...rows[0], planId };
    result.perCycleCost /= 100;
    return result;
  } catch (asyncError) {
    if (errMsg) {
      throw new ApolloError(errMsg);
      // will need to handle this error in front end
      // where the join page will send this query request
    }
    console.log(asyncError);
    throw new ApolloError('Unable to retrieve plan information');
  }
}

export async function viewAllPlans(username) {
  try {
    const { rows } = await viewAllPlansModel(username);
    rows.forEach((row) => {
      row.perCycleCost /= 100;
    });
    return rows;
  } catch (asyncError) {
    console.log(asyncError);
    throw new ApolloError('Unable to retrieve plans information');
  }
}

export async function activeMembers(planId, username) {
  try {
    const { rows } = await membersOnOnePlan(planId, username);
    return rows;
  } catch (asyncError) {
    console.log(asyncError);
    throw new ApolloError('Unable to retrieve plan information');
  }
}
