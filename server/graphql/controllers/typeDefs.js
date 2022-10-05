import { gql } from 'apollo-server-core';

export default gql`
  type Query {
    viewOnePlan (planId: String!): Plan!
    viewAllPlans: [Plan]!
  }

  type PlanMember {
    firstName: String!
    lastName: String!
    username: ID!
    quantity: Int # 0 means not paying # nullable because quantity for owner field is null
  }

  type LoginInfo {
    username: String!
    email: String!
    token: String!
  }

  type PaymentIntent {
    clientSecret: String!
  }

  type ProductId {
    productId: String!
  }

  enum CycleFrequency {
    WEEKLY
    MONTHLY
    YEARLY
  }

  type Plan {
    planId: ID!
    name: String!
    owner: PlanMember!
    cycleFrequency: CycleFrequency!
    perCycleCost: Float!
    activeMembers: [PlanMember]! # can include owner, will only include members whose quantity > 0
    maxQuantity: Int # nullable because viewAllPlans query doesn't need this info
  }

  type Mutation {
    createUser(
      firstName: String!
      lastName: String!
      username: String!
      password: String!
      email: String!
    ): LoginInfo!

    login(
      username: String!
      password: String!
    ): LoginInfo

    createPlan(
      planName: String!
      cycleFrequency: CycleFrequency!
      perCycleCost: Float!
      maxQuantity: Int!
    ): ProductId!
    # returning stripe product ID here, which will be used as code

    pay(
      planId: String!
      quantity: Int!
    ): PaymentIntent! # returning client secret
  }
`;
