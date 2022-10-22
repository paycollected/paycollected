import { gql } from 'apollo-server-core';

export default gql`
  scalar PlanID

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
    subscriptionId: String!
  }

  type ProductId {
    productId: String!
  }

  type PortalSession {
    portalSessionURL: String!
  }

  type EditQuantResponse {
    planId: ID!
    quantity: Int!
  }

  type SubsModificationResponse {
    planId: ID!
  }

  type CancelTransactionResponse {
    subscriptionId: String!
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
    ): ProductId!
    # returning stripe product ID here, which will be used as code

    joinPlan(
      planId: ID!
      quantity: Int!
    ): PaymentIntent! # returning client secret

    editPayment: PortalSession!

    unsubscribe(
      subscriptionId: String!
    ): SubsModificationResponse!

    unsubscribeAsOwner(
      subscriptionId: String!
      planId: String!
      newOwner: String!
    ): SubsModificationResponse!

    editQuantity(
      subscriptionId: String!
      newQuantity: Int!
    ): EditQuantResponse!

    deletePlan(
      planId: ID!
    ): SubsModificationResponse!

    cancelTransaction(
      subscriptionId: String!
    ): CancelTransactionResponse!
  }
`;
