import { GraphQLScalarType, Kind } from 'graphql';
import { UserInputError } from 'apollo-server-core';

const generateRegExValidationFn = (regEx) => ((input) => {
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
  generateRegExValidationFn(/^prod_(?:[a-zA-Z0-9]){14}$/)
);

export const subscriptionIdScalar = generateCustomScalar(
  'SubscriptionID',
  generateRegExValidationFn(/^sub_(?:[a-zA-Z0-9]){24}$/)
);

export const emailScalar = generateCustomScalar(
  'Email',
  generateRegExValidationFn(
    /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  )
);

export const usernameScalar = generateCustomScalar(
  'Username',
  generateRegExValidationFn(/^(?:[a-z]){1}(?:[a-zA-Z0-9\._-])$/)
  // TODO: come up with a valid set of rules for username
);