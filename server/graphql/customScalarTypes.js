import { GraphQLScalarType, Kind, GraphQLError } from 'graphql';

const generateRegExValidationFn = (regEx) => ((input) => {
  if (typeof input === 'string' && regEx.test(input)) {
    return input;
  }
  throw new GraphQLError("Fail schema's type validation", { extensions: { code: 'GRAPHQL_VALIDATION_FAILED' } });
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
      throw new GraphQLError("Fail schema's type validation", { extensions: { code: 'GRAPHQL_VALIDATION_FAILED' } });
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

export const paymentMethodIdScalar = generateCustomScalar(
  'PaymentMethodID',
  generateRegExValidationFn(/^pm_(?:[a-zA-Z0-9]){24}$/)
);

export const setupIntentIdScalar = generateCustomScalar(
  'SetupIntentID',
  generateRegExValidationFn(/^seti_(?:[a-zA-Z0-9]{24})$/)
);

export const testClockScalar = generateCustomScalar(
  'TestClockID',
  generateRegExValidationFn(/^clock_(?:[a-zA-Z0-9]{24})$/)
);
