import { gql } from 'apollo-server-core';

export default gql`
  scalar PlanID

  scalar SubscriptionID

  type Query {
    viewOnePlan (planId: PlanID!): Plan!
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
    subscriptionId: SubscriptionID!
  }
 ##
  type PlanIdResponse {
    planId: PlanID!
  }

  type PortalSession {
    portalSessionURL: String!
  }

  type EditQuantResponse {
    planId: PlanID!
    quantity: Int!
  }

  type CancelTransactionResponse {
    subscriptionId: SubscriptionID!
  }

  enum CycleFrequency {
    WEEKLY
    MONTHLY
    YEARLY
  }

  type Plan {
    planId: PlanID!
    name: String!
    owner: PlanMember!
    cycleFrequency: CycleFrequency!
    perCycleCost: Float!
    activeMembers: [PlanMember]!
    # can include owner, will only include members whose quantity > 0
    # does not include user requesting this info
    subscriptionId: String
    quantity: Int! # unit quant of this plan for current user
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
    ): PlanIdResponse!
    # returning stripe product ID here, which will be used as code

    joinPlan(
      planId: PlanID!
      quantity: Int!
    ): PaymentIntent! # returning client secret

    editPayment: PortalSession!

    unsubscribe(
      subscriptionId: SubscriptionID!
    ): PlanIdResponse!

    unsubscribeAsOwner(
      subscriptionId: SubscriptionID!
      planId: PlanID!
      newOwner: String!
    ): PlanIdResponse!

    editQuantity(
      subscriptionId: SubscriptionID!
      newQuantity: Int!
    ): EditQuantResponse!

    deletePlan(
      planId: PlanID!
    ): PlanIdResponse!

    cancelTransaction(
      subscriptionId: SubscriptionID!
    ): CancelTransactionResponse!
  }
`;
