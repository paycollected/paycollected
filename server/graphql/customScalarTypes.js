import { GraphQLScalarType, Kind } from 'graphql';
import { UserInputError } from 'apollo-server-core';

const generateValidationFn = (regEx) => ((input) => {
  if (typeof input === 'string' && regEx.test(input)) {
    return input;
  }
  throw new UserInputError();
});

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

export const planIdScalar = generateCustomScalar(
  'PlanID',
  generateValidationFn(/^prod_(?:[a-zA-Z0-9]){14}$/)
);

export const subscriptionIdScalar = generateCustomScalar(
  'SubscriptionID',
  generateValidationFn(/^sub_(?:[a-zA-Z0-9]){24}$/)
);
