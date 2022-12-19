import { GraphQLError } from 'graphql';

export default function authResolverWrapper(someResolver) {
  return function(parent, args, context, info) {
    const { user, err } = context;
    switch (true) {
      case (err === 'Incorrect token'):
        throw new GraphQLError(err, { extensions: { code: 'FORBIDDEN' } });
      case (err === 'Unauthorized request'):
        throw new GraphQLError(err, { extensions: { code: 'FORBIDDEN' } });
      case (!!user):
        return someResolver(parent, args, context, info);
      default:
        break;
    }
  };
}
