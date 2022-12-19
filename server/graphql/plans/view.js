import { GraphQLError } from 'graphql';
import { planDetail, plansSummary } from '../../db/models.js';


export async function viewOnePlan(planId, username) {
  let errMsg;

  try {
    const { rows } = await planDetail(planId, username);
    if (rows.length === 0) { // no match
      errMsg = 'No plan matched search or plan has been archived';
      throw new Error();
    }
    return rows[0];
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
