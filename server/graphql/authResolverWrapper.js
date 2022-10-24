import { AuthenticationError, ForbiddenError } from 'apollo-server-core';

export default function authResolverWrapper(someResolver) {
  return function(parent, args, context, info) {
    const { user, err } = context;
    switch (true) {
      case (err === 'Incorrect token'):
        throw new AuthenticationError(err);
      case (err === 'Unauthorized request'):
        throw new ForbiddenError(err);
      case (!!user):
        return someResolver(parent, args, context, info);
      default:
        break;
    }
  };
}
