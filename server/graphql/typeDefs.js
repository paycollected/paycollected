import { gql } from 'apollo-server-core';

export default gql`
  scalar PlanID
  scalar SubscriptionID
  scalar Username
  scalar Email

  type Query {
    viewOnePlan (planId: PlanID!): Plan!
    viewAllPlans: [Plan]!
  }

  type PlanMember {
    firstName: String!
    lastName: String!
    username: ID!
    # username: Username
    quantity: Int # 0 means not paying # nullable because quantity for owner field is null
  }

  type LoginInfo {
    username: String!
    # username: Username!
    email: Email!
    token: String!
  }

  type PaymentIntentAndPaymentMethods {
    clientSecret: String!
    subscriptionId: SubscriptionID!
    paymentMethods: [PaymentMethod]!
  }

  type PaymentMethod {
    id: ID!
    brand: String!
    expiryMonth: Int!
    expiryYear: Int!
  }

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

  enum TimeZone {
    EASTERN
    CENTRAL
    MOUNTAIN
    PACIFIC
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
    subscriptionId: SubscriptionID
    quantity: Int! # unit quant of this plan for current user
  }

  type Mutation {
    createUser(
      firstName: String!
      lastName: String!
      username: String!
      # username: Username!
      password: String!
      email: Email!
    ): LoginInfo!

    login(
      username: String!
      # username: Username!
      password: String!
    ): LoginInfo

    createPlan(
      planName: String!
      cycleFrequency: CycleFrequency!
      perCycleCost: Float!
      startDate: String! # datestring
      timeZone: TimeZone!
    ): PlanIdResponse!
    # returning stripe product ID here, which will be used as code

    joinPlan(
      planId: PlanID!
      quantity: Int!
    ): PaymentIntentAndPaymentMethods! # returning client secret

    editPayment: PortalSession!

    unsubscribe(
      subscriptionId: SubscriptionID!
    ): PlanIdResponse!

    unsubscribeAsOwner(
      subscriptionId: SubscriptionID!
      planId: PlanID!
      newOwner: String!
      # newOwner: Username!
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
