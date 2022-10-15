import { gql } from 'apollo-server-core';

export default gql`
  type Query {
    viewOnePlan (planId: ID!): Plan!
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
    email: String!
  }

  type ProductId {
    productId: String!
  }

  type PortalSession {
    portalSessionURL: String!
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
    subscriptionId: String
    quantity: Int
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
      startDate: String! # in UTC format
    ): ProductId!
    # returning stripe product ID here, which will be used as code

    joinPlan(
      planId: ID!
      quantity: Int!
    ): PaymentIntent! # returning client secret

    editPayment: PortalSession!

    unsubscribe(
      subscriptionId: String!
    ): String!

    unsubscribeAsOwner(
      subscriptionId: String!
      planId: String!
      newOwner: String!
    ): String!

    editQuantity(
      subscriptionId: String!
      newQuantity: Int!
    ): String!
  }
`;
