import { GraphQLScalarType, Kind, GraphQLError } from 'graphql';

const validatePlanId = (planId) => {
  const planIdRegex = /^prod_(?:[a-zA-Z0-9]){14}$/;
  if (typeof planId === 'string' && planIdRegex.test(planId)) {
    return planId;
  }
  throw new GraphQLError('Not a valid plan ID', {
    extensions: { code: 'BAD_USER_INPUT' },
  });
};

export const planIdScalar = new GraphQLScalarType({
  name: 'PlanID',
  description: 'PlanID custom scalar type',
  serialize(val) { return validatePlanId(val); },
  parseValue(val) { return validatePlanId(val); },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return validatePlanId(ast.value);
    }
    throw new GraphQLError('Not a valid plan ID', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  },
});

export const subscriptionIdScalar = new GraphQLScalarType({
  name: 'SubscriptionID',
  description: 'SubscriptionID custom scalar type',
  serialize(val) { return validatePlanId(val); },
  parseValue(val) { return validatePlanId(val); },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return validatePlanId(ast.value);
    }
    throw new GraphQLError('Not a valid plan ID', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  },
});
