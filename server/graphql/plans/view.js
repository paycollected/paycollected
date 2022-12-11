import { GraphQLError } from 'graphql';
import {
  viewOnePlan as viewOnePlanModel,
  membersOnOnePlan, plansSummary,
} from '../../db/models.js';


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
      throw new GraphQLError(errMsg, { extensions: { code: 'BAD_REQUEST' } });
    }
    console.log(asyncError);
    throw new GraphQLError('Unable to retrieve plan information', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }
}

export async function viewAllPlans(username) {
  try {
    const { rows } = await plansSummary(username);
    return rows[0];
  } catch (asyncError) {
    console.log(asyncError);
    throw new GraphQLError('Unable to retrieve plans information', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }
}

export async function activeMembers(planId, username) {
  try {
    const { rows } = await membersOnOnePlan(planId, username);
    return rows;
  } catch (asyncError) {
    console.log(asyncError);
    throw new GraphQLError('Unable to retrieve members information', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }
}
