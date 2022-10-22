import { GraphQLScalarType, Kind } from 'graphql';
import { UserInputError } from 'apollo-server-core';


const validatePlanId = (planId) => {
  const planIdRegex = /^prod_(?:[a-zA-Z0-9]){14}$/;
  if (typeof planId === 'string' && planIdRegex.test(planId)) {
    return planId;
  }
  throw new UserInputError();
};

const validateSubsId = (subsId) => {
  const subsIdRegex = /^sub_(?:[a-zA-Z0-9]){24}$/;
  if (typeof subsId === 'string' && subsIdRegex.test(subsId)) {
    return subsId;
  }
  throw new UserInputError();
};

const generateCustomScalar = (scalarName, validationFn) => (
  new GraphQLScalarType({
    name: scalarName,
    serialize: (val) => validationFn(val),
    parseValue: (val) => validationFn(val),
    parseLiteral: (ast) => {
      if (ast.kind === Kind.STRING) {
        return validationFn(ast.value);
      }
      throw new UserInputError();
    },
  })
);

export const planIdScalar = generateCustomScalar('PlanID', validatePlanId);
export const subscriptionIdScalar = generateCustomScalar('SubscriptionID', validateSubsId);
